// @flow

import path from 'path';
import MashroomSecurityACLChecker from '../acl/MashroomSecurityACLChecker';

import type {
    MashroomSecurityACLChecker as MashroomSecurityACLCheckerType,
    MashroomSecurityProviderRegistry,
    MashroomSecurityService as MashroomSecurityServiceType,
    MashroomSecurityPermission,
    MashroomSecurityProtectedResource,
    MashroomSecurityResourceType,
    MashroomSecurityRoleDefinition, MashroomSecurityProvider,
} from '../../type-definitions';
import type {
    MashroomLogger,
    MashroomLoggerFactory,
    ExpressRequest,
    ExpressResponse,
} from '@mashroom/mashroom/type-definitions';
import type {MashroomStorageCollection} from '@mashroom/mashroom-storage/type-definitions';

export const ROLE_ADMINISTRATOR = 'Administrator';
export const ROLE_AUTHENTICATED_USER = 'Authenticated';

const RESOURCE_PERMISSIONS_COLLECTION_NAME = 'mashroom-security-resource-permissions';
const ROLE_DEFINITIONS_COLLECTION_NAME = 'mashroom-security-role-definitions';

export default class MashroomSecurityService implements MashroomSecurityServiceType {

    _securityProviderRegistry: MashroomSecurityProviderRegistry;
    _securityProviderName: string;
    _aclPath: string;
    _aclChecker: MashroomSecurityACLCheckerType;
    _logger: MashroomLogger;

    constructor(securityProviderName: string, securityProviderRegistry: MashroomSecurityProviderRegistry, aclPath: string, serverRootFolder: string, loginPage: string, loggerFactory: MashroomLoggerFactory) {
        this._securityProviderName = securityProviderName;
        this._securityProviderRegistry = securityProviderRegistry;
        this._logger = loggerFactory('mashroom.security.service');

        this._aclPath = aclPath;
        if (!path.isAbsolute(this._aclPath)) {
            this._aclPath = path.resolve(serverRootFolder, this._aclPath);
        }
        this._aclChecker = new MashroomSecurityACLChecker(this._aclPath, loggerFactory);

        this._logger.info(`Configured ACL definition: ${this._aclPath}`);
    }

    getUser(request: ExpressRequest) {
        const securityProvider = this._getSecurityProvider();
        if (securityProvider) {
            try {
                const user = securityProvider.getUser(request);
                if (user) {
                    if (!user.roles) {
                        user.roles = [];
                    }
                    if (user.roles.indexOf(ROLE_AUTHENTICATED_USER) === -1) {
                        user.roles.push(ROLE_AUTHENTICATED_USER);
                    }
                }
                return user;
            } catch (error) {
                this._logger.error('Security provider threw an error', error);
                return null;
            }
        }
    }

    isAuthenticated(request: ExpressRequest) {
        return !!this.getUser(request);
    }

    isInRole(request: ExpressRequest, roleName: string) {
        const user = this.getUser(request);
        return !!user && user.roles && user.roles.indexOf(roleName) !== -1;
    }

    isAdmin(request: ExpressRequest) {
        return this.isInRole(request, ROLE_ADMINISTRATOR);
    }

    async checkACL(request: ExpressRequest) {
        if (this.isAdmin(request)) {
            return true;
        }

        const user = await this.getUser(request);
        return this._aclChecker.allowed(request, user);
    }

    async addRoleDefinition(request: ExpressRequest, roleDefinition: MashroomSecurityRoleDefinition) {
        if (!roleDefinition.id) {
            throw new Error('Cannot add role definition because id is required');
        }

        const roleDefinitionsCollection = await this._getRoleDefinitionsCollection(request);
        const existingRole = await this._findRole(roleDefinitionsCollection, roleDefinition.id);
        if (!existingRole) {
            roleDefinitionsCollection.insertOne(roleDefinition);
        } else {
            roleDefinitionsCollection.updateOne({id: roleDefinition.id}, Object.assign({}, existingRole, {
                description: roleDefinition.description
            }));
        }
    }

    async getExistingRoles(request: ExpressRequest): Promise<Array<MashroomSecurityRoleDefinition>> {
        const roleDefinitionsCollection = await this._getRoleDefinitionsCollection(request);
        return await roleDefinitionsCollection.find();
    }

    async updateResourcePermission(request: ExpressRequest, resource: MashroomSecurityProtectedResource) {
        const resourcePermissionCollection = await this._getResourcePermissionsCollection(request);
        const existingResourcePermission = await this._findResourcePermission(resourcePermissionCollection, resource.type, resource.key);

        // Remove permissions without roles
        if (resource.permissions) {
            resource.permissions = resource.permissions.filter((p) => p.roles && p.roles.length > 0);
            if (resource.permissions && resource.permissions.length === 0) {
                resource.permissions = null;
            }
        }

        if (existingResourcePermission) {
            if (resource.permissions) {
                await resourcePermissionCollection.updateOne({type: resource.type, key: resource.key}, resource);
            } else {
                await resourcePermissionCollection.deleteOne({type: resource.type, key: resource.key});
            }
        } else {
            await resourcePermissionCollection.insertOne(resource);
        }

        // Add roles
        const roleDefinitionsCollection = await this._getRoleDefinitionsCollection(request);
        let roles = [];
        if (resource.permissions) {
            resource.permissions.forEach((p) => {
                roles = roles.concat(p.roles)
            });
        }
        roles.forEach(async (roleId) => {
            const exists = await this._findRole(roleDefinitionsCollection, roleId) !== null;
            if (!exists) {
                await roleDefinitionsCollection.insertOne({id :roleId});
            }
        });
    }

    async getResourcePermissions(request: ExpressRequest, resourceType: MashroomSecurityResourceType, resourceKey: string) {
        const resourcePermissionCollection = await this._getResourcePermissionsCollection(request);
        return await this._findResourcePermission(resourcePermissionCollection, resourceType, resourceKey);
    }

    async checkResourcePermission(request: ExpressRequest, resourceType: string, resourceKey: string, permission: MashroomSecurityPermission, allowIfNoResourceDefinitionFound?: boolean = false) {
        if (this.isAdmin(request)) {
            return true;
        }
        const user = this.getUser(request);

        const resourcePermissionCollection = await this._getResourcePermissionsCollection(request);
        const existingResourcePermission: ?MashroomSecurityProtectedResource = await this._findResourcePermission(resourcePermissionCollection, resourceType, resourceKey);

        if (!existingResourcePermission || !existingResourcePermission.permissions) {
            return allowIfNoResourceDefinitionFound;
        }

        const matchingPermissions = existingResourcePermission.permissions.filter((p) => p.permissions && p.permissions.indexOf(permission) !== -1);
        if (!matchingPermissions) {
            return allowIfNoResourceDefinitionFound;
        }

        return matchingPermissions.some((p) => p.roles.some((r) => user && user.roles.indexOf(r) !== -1));
    }

    async authenticate(request: ExpressRequest, response: ExpressResponse) {
        if (this.isAuthenticated(request)) {
            return {
                status: 'authenticated'
            };
        }

        const securityProvider = this._getSecurityProvider();
        if (securityProvider) {
            try {
                // To prevent phishing, create a new session
                request.session.destroy();
                return await securityProvider.authenticate(request, response);
            } catch (e) {
                this._logger.error('Security provider returned error: ', e);
            }
        }

        return {
            status: 'error'
        };
    }

    async refreshAuthentication(request: ExpressRequest) {
        const securityProvider = this._getSecurityProvider();
        if (securityProvider) {
            try {
                await securityProvider.refreshAuthentication(request);
            } catch (e) {
                this._logger.error('Security provider returned error: ', e);
            }
        }
    }

    getAuthenticationExpiration(request: ExpressRequest) {
        const securityProvider = this._getSecurityProvider();
        if (securityProvider) {
            try {
                return securityProvider.getAuthenticationExpiration(request);
            } catch (e) {
                this._logger.error('Security provider returned error: ', e);
            }
        }
    }

    async revokeAuthentication(request: ExpressRequest) {
        const securityProvider = this._getSecurityProvider();
        if (securityProvider) {
            try {
                await securityProvider.revokeAuthentication(request);
                // Create a new session to make sure no data of the authenticated user remains
                request.session.destroy();
            } catch (e) {
                this._logger.error('Security provider returned error: ', e);
            }
        }
    }

    async login(request: ExpressRequest, username: string, password: string) {
        const securityProvider = this._getSecurityProvider();
        if (securityProvider) {
            try {
                return await securityProvider.login(request, username, password);
            } catch (e) {
                this._logger.error('Security provider returned error: ', e);
            }
        }

        return {
            success: false
        };
    }

    _getSecurityProvider(): ?MashroomSecurityProvider {
        const securityProvider = this._securityProviderRegistry.findProvider(this._securityProviderName);
        if (!securityProvider) {
            this._logger.warn(`Cannot authenticate because the security provider is not (yet) loaded: ${this._securityProviderName}`);
            return null;
        }
        return securityProvider;
    }

    async _findResourcePermission(collection: MashroomStorageCollection<MashroomSecurityProtectedResource>, type: MashroomSecurityResourceType, key: string): Promise<?MashroomSecurityProtectedResource> {
        return collection.findOne({type, key});
    }

    async _getResourcePermissionsCollection(request: ExpressRequest): Promise<MashroomStorageCollection<MashroomSecurityProtectedResource>> {
        const storageService = request.pluginContext.services.storage.service;
        return storageService.getCollection(RESOURCE_PERMISSIONS_COLLECTION_NAME);
    }

    async _findRole(collection: MashroomStorageCollection<MashroomSecurityRoleDefinition>, id: string): Promise<?MashroomSecurityRoleDefinition> {
        return collection.findOne({id});
    }

    async _getRoleDefinitionsCollection(request: ExpressRequest): Promise<MashroomStorageCollection<MashroomSecurityRoleDefinition>> {
        const storageService = request.pluginContext.services.storage.service;
        return storageService.getCollection(ROLE_DEFINITIONS_COLLECTION_NAME);
    }
}

