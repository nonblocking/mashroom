// @flow

import querystring from 'querystring';
import {isAjaxRequest} from '@mashroom/mashroom-utils/lib/request_utils';

import type {ExpressRequest, ExpressResponse, MashroomLogger,} from '@mashroom/mashroom/type-definitions';
import type {MashroomStorageCollection} from '@mashroom/mashroom-storage/type-definitions';
import type {
    MashroomSecurityPermission,
    MashroomSecurityProtectedResource,
    MashroomSecurityProvider,
    MashroomSecurityResourceType,
    MashroomSecurityRoleDefinition,
    MashroomSecurityService as MashroomSecurityServiceType,
} from '../../type-definitions';
import type {MashroomSecurityACLChecker, MashroomSecurityProviderRegistry,} from '../../type-definitions/internal';

export const ROLE_ADMINISTRATOR = 'Administrator';
export const ROLE_AUTHENTICATED_USER = 'Authenticated';

const RESOURCE_PERMISSIONS_COLLECTION_NAME = 'mashroom-security-resource-permissions';
const ROLE_DEFINITIONS_COLLECTION_NAME = 'mashroom-security-role-definitions';

const privatePropsMap: WeakMap<MashroomSecurityService, {
    securityProviderRegistry: MashroomSecurityProviderRegistry;
}> = new WeakMap();

export default class MashroomSecurityService implements MashroomSecurityServiceType {

    _securityProviderName: string;
    _forwardQueryHintsToProvider: ?Array<string>;
    _aclChecker: MashroomSecurityACLChecker;

    constructor(securityProviderName: string, forwardQueryHintsToProvider: ?Array<string>, securityProviderRegistry: MashroomSecurityProviderRegistry, aclChecker: MashroomSecurityACLChecker) {
        this._securityProviderName = securityProviderName;
        this._forwardQueryHintsToProvider = forwardQueryHintsToProvider;
        privatePropsMap.set(this, {
            securityProviderRegistry,
        });
        this._aclChecker = aclChecker;
    }

    getUser(request: ExpressRequest) {
        const logger: MashroomLogger = request.pluginContext.loggerFactory('mashroom.security.service');

        const securityProvider = this._getSecurityProvider(logger);
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
                logger.error('Security provider threw an error', error);
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

        const user = this.getUser(request);
        return this._aclChecker.allowed(request, user);
    }

    async addRoleDefinition(request: ExpressRequest, roleDefinition: MashroomSecurityRoleDefinition) {
        if (!roleDefinition.id) {
            throw new Error('Cannot add role definition because id is required');
        }

        const roleDefinitionsCollection = await this._getRoleDefinitionsCollection(request);
        const existingRole = await this._findRole(roleDefinitionsCollection, roleDefinition.id);
        if (!existingRole) {
            await roleDefinitionsCollection.insertOne(roleDefinition);
        } else {
            await roleDefinitionsCollection.updateOne({id: roleDefinition.id}, {
                ...existingRole,
                description: roleDefinition.description
            });
        }
    }

    async getExistingRoles(request: ExpressRequest): Promise<Array<MashroomSecurityRoleDefinition>> {
        const roleDefinitionsCollection = await this._getRoleDefinitionsCollection(request);
        return await roleDefinitionsCollection.find();
    }

    async updateResourcePermission(request: ExpressRequest, resource: MashroomSecurityProtectedResource) {
        // Remove permissions without roles
        if (resource.permissions) {
            resource.permissions = resource.permissions.filter((p) => p.roles && p.roles.length > 0);
            if (resource.permissions && resource.permissions.length === 0) {
                resource.permissions = null;
            }
        }

        const resourcePermissionCollection = await this._getResourcePermissionsCollection(request);
        const existingResourcePermission = await this._findResourcePermission(resourcePermissionCollection, resource.type, resource.key);

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
        for (let i = 0; i < roles.length; i++) {
            const roleId = roles[i];
            const exists = await this._findRole(roleDefinitionsCollection, roleId) !== null;
            if (!exists) {
                await roleDefinitionsCollection.insertOne({id: roleId});
            }
        }
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

    async canAuthenticateWithoutUserInteraction(request: ExpressRequest) {
        const logger: MashroomLogger = request.pluginContext.loggerFactory('mashroom.security.service');
        const securityProvider = this._getSecurityProvider(logger);
        if (securityProvider) {
            try {
                return await securityProvider.canAuthenticateWithoutUserInteraction(request);
            } catch (e) {
                logger.error('Security provider returned error: ', e);
            }
        }
        return false;
    }

    async authenticate(request: ExpressRequest, response: ExpressResponse) {
        const logger: MashroomLogger = request.pluginContext.loggerFactory('mashroom.security.service');

        if (this.isAuthenticated(request)) {
            return {
                status: 'authenticated'
            };
        }

        const securityProvider = this._getSecurityProvider(logger);
        if (securityProvider) {
            try {
                // If this is a html request, create a new session to prevent session fixation attacks
                // See https://owasp.org/www-community/attacks/Session_fixation
                if (!isAjaxRequest(request)) {
                    await this._createNewSession(request);
                }
                const authenticationHints = this._getAuthenticationHints(request);
                this._removeAuthenticationHintsFromUrl(request, authenticationHints);
                return await securityProvider.authenticate(request, response, authenticationHints);
            } catch (e) {
                logger.error('Security provider returned error: ', e);
            }
        }

        return {
            status: 'error'
        };
    }

    async checkAuthentication(request: ExpressRequest) {
        const logger: MashroomLogger = request.pluginContext.loggerFactory('mashroom.security.service');

        const securityProvider = this._getSecurityProvider(logger);
        if (securityProvider) {
            try {
                await securityProvider.checkAuthentication(request);
            } catch (e) {
                logger.error('Security provider returned error: ', e);
            }
        }
    }

    getAuthenticationExpiration(request: ExpressRequest) {
        const logger: MashroomLogger = request.pluginContext.loggerFactory('mashroom.security.service');

        const securityProvider = this._getSecurityProvider(logger);
        if (securityProvider) {
            try {
                return securityProvider.getAuthenticationExpiration(request);
            } catch (e) {
                logger.error('Security provider returned error: ', e);
            }
        }
    }

    async revokeAuthentication(request: ExpressRequest) {
        const logger: MashroomLogger = request.pluginContext.loggerFactory('mashroom.security.service');

        const securityProvider = this._getSecurityProvider(logger);
        if (securityProvider) {
            try {
                await securityProvider.revokeAuthentication(request);
                // Create a new session to make sure no data of the authenticated user remains
                await this._createNewSession(request);
            } catch (e) {
                logger.error('Security provider returned error: ', e);
            }
        }
    }

    async login(request: ExpressRequest, username: string, password: string) {
        const logger: MashroomLogger = request.pluginContext.loggerFactory('mashroom.security.service');

        const securityProvider = this._getSecurityProvider(logger);
        if (securityProvider) {
            try {
                return await securityProvider.login(request, username, password);
            } catch (e) {
                logger.error('Security provider returned error: ', e);
            }
        }

        return {
            success: false
        };
    }

    getSecurityProvider(name: string) {
        const privateProps = privatePropsMap.get(this);
        return privateProps && privateProps.securityProviderRegistry.findProvider(name);
    }

    _getSecurityProvider(logger: MashroomLogger): ?MashroomSecurityProvider {
        const securityProvider = this.getSecurityProvider(this._securityProviderName);
        if (!securityProvider) {
            logger.warn(`Cannot authenticate because the security provider is not (yet) loaded: ${this._securityProviderName}`);
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

    async _createNewSession(request: ExpressRequest) {
        const logger: MashroomLogger = request.pluginContext.loggerFactory('mashroom.security.service');
        logger.debug('Invalidating session');

        return new Promise((resolve) => {
            request.session.regenerate((err) => {
                if (err) {
                    logger.warn('Session invalidation failed!', err);
                }
                resolve();
            });
        })
    }

    _getAuthenticationHints(request: ExpressRequest): any {
        const {query} = request;
        const forwardQueryParams = this._forwardQueryHintsToProvider;
        const hints = {};
        if (!Array.isArray(forwardQueryParams) || forwardQueryParams.length === 0) {
            return {};
        }
        Object.keys(query).forEach((paramName) => {
            if (forwardQueryParams.indexOf(paramName) !== -1) {
                hints[paramName] = query[paramName];
            }
        });
        return hints;
    }

    _removeAuthenticationHintsFromUrl(request: ExpressRequest, hints: any) {
        const queryParams = {...request.query};
        Object.keys(hints).forEach((key) => delete queryParams[key]);
        const query = querystring.stringify(queryParams);

        request.url = request.url.split('?')[0] + (query ? `?${query}` : '');
        request.originalUrl = request.originalUrl.split('?')[0] + (query ? `?${query}` : '');
    }
}

