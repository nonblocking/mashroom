
import querystring from 'querystring';
import {isHtmlRequest} from '@mashroom/mashroom-utils/lib/request_utils';

import type {Request, Response} from 'express';
import type {MashroomLogger,} from '@mashroom/mashroom/type-definitions';
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
import {
    MashroomSecurityAuthenticationResult,
    MashroomSecurityLoginResult,
    MashroomSecurityUser
} from '../../type-definitions';

export const ROLE_ADMINISTRATOR = 'Administrator';
export const ROLE_AUTHENTICATED_USER = 'Authenticated';

const RESOURCE_PERMISSIONS_COLLECTION_NAME = 'mashroom-security-resource-permissions';
const ROLE_DEFINITIONS_COLLECTION_NAME = 'mashroom-security-role-definitions';

const privatePropsMap: WeakMap<MashroomSecurityService, {
    securityProviderRegistry: MashroomSecurityProviderRegistry;
}> = new WeakMap();

export default class MashroomSecurityService implements MashroomSecurityServiceType {

    constructor(private _securityProviderName: string, private _forwardQueryHintsToProvider: Array<string> | undefined | null,
                securityProviderRegistry: MashroomSecurityProviderRegistry, private _aclChecker: MashroomSecurityACLChecker) {
        privatePropsMap.set(this, {
            securityProviderRegistry,
        });
    }

    getUser(request: Request): MashroomSecurityUser | null | undefined {
        const logger: MashroomLogger = request.pluginContext.loggerFactory('mashroom.security.service');

        const securityProvider = this._getSecurityProvider(logger);
        if (securityProvider) {
            try {
                let user = securityProvider.getUser(request);
                if (user) {
                    if (!user.roles) {
                        user = {
                            ...user,
                            roles: [],
                        }
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

    isAuthenticated(request: Request): boolean {
        return !!this.getUser(request);
    }

    isInRole(request: Request, roleName: string): boolean {
        const user = this.getUser(request);
        return !!user && user.roles && user.roles.indexOf(roleName) !== -1;
    }

    isAdmin(request: Request): boolean {
        return this.isInRole(request, ROLE_ADMINISTRATOR);
    }

    async checkACL(request: Request): Promise<boolean> {
        if (this.isAdmin(request)) {
            return true;
        }

        const user = this.getUser(request);
        return this._aclChecker.allowed(request, user);
    }

    async addRoleDefinition(request: Request, roleDefinition: MashroomSecurityRoleDefinition): Promise<void> {
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

    async getExistingRoles(request: Request): Promise<Array<MashroomSecurityRoleDefinition>> {
        const roleDefinitionsCollection = await this._getRoleDefinitionsCollection(request);
        return await roleDefinitionsCollection.find();
    }

    async updateResourcePermission(request: Request, resource: MashroomSecurityProtectedResource): Promise<void> {
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
        let roles: Array<string> = [];
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

    async getResourcePermissions(request: Request, resourceType: MashroomSecurityResourceType, resourceKey: string): Promise<MashroomSecurityProtectedResource | null | undefined> {
        const resourcePermissionCollection = await this._getResourcePermissionsCollection(request);
        return await this._findResourcePermission(resourcePermissionCollection, resourceType, resourceKey);
    }

    async checkResourcePermission(request: Request, resourceType: string, resourceKey: string, permission: MashroomSecurityPermission, allowIfNoResourceDefinitionFound = false): Promise<boolean> {
        if (this.isAdmin(request)) {
            return true;
        }
        const user = this.getUser(request);

        const resourcePermissionCollection = await this._getResourcePermissionsCollection(request);
        const existingResourcePermission: MashroomSecurityProtectedResource | undefined | null = await this._findResourcePermission(resourcePermissionCollection, resourceType, resourceKey);

        if (!existingResourcePermission || !existingResourcePermission.permissions) {
            return allowIfNoResourceDefinitionFound;
        }

        const matchingPermissions = existingResourcePermission.permissions.filter((p) => p.permissions && p.permissions.indexOf(permission) !== -1);
        if (!matchingPermissions) {
            return allowIfNoResourceDefinitionFound;
        }

        return matchingPermissions.some((p) => p.roles.some((r) => user && user.roles.indexOf(r) !== -1));
    }

    async canAuthenticateWithoutUserInteraction(request: Request): Promise<boolean> {
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

    async authenticate(request: Request, response: Response): Promise<MashroomSecurityAuthenticationResult> {
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
                if (isHtmlRequest(request)) {
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

    async checkAuthentication(request: Request): Promise<void> {
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

    getAuthenticationExpiration(request: Request): number | null | undefined {
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

    async revokeAuthentication(request: Request): Promise<void> {
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

    async login(request: Request, username: string, password: string): Promise<MashroomSecurityLoginResult> {
        const logger: MashroomLogger = request.pluginContext.loggerFactory('mashroom.security.service');

        if (!username?.trim() || !password?.trim()) {
            logger.error('Attempt to login with username/password');
            return {
                success: false,
                failureReason: 'Invalid credentials'
            };
        }

        const securityProvider = this._getSecurityProvider(logger);
        if (securityProvider) {
            try {
                return await securityProvider.login(request, username, password);
            } catch (e) {
                logger.error('Security provider returned error: ', e);
            }
        }

        return {
            success: false,
            failureReason: 'Login not supported'
        };
    }

    getSecurityProvider(name: string): MashroomSecurityProvider | null | undefined {
        const privateProps = privatePropsMap.get(this);
        return privateProps && privateProps.securityProviderRegistry.findProvider(name);
    }

    private _getSecurityProvider(logger: MashroomLogger): MashroomSecurityProvider | undefined | null {
        const securityProvider = this.getSecurityProvider(this._securityProviderName);
        if (!securityProvider) {
            logger.warn(`Cannot authenticate because the security provider is not (yet) loaded: ${this._securityProviderName}`);
            return null;
        }
        return securityProvider;
    }

    private async _findResourcePermission(collection: MashroomStorageCollection<MashroomSecurityProtectedResource>, type: MashroomSecurityResourceType, key: string): Promise<MashroomSecurityProtectedResource | undefined | null> {
        return collection.findOne({type, key});
    }

    private async _getResourcePermissionsCollection(request: Request): Promise<MashroomStorageCollection<MashroomSecurityProtectedResource>> {
        const storageService = request.pluginContext.services.storage.service;
        return storageService.getCollection(RESOURCE_PERMISSIONS_COLLECTION_NAME);
    }

    private async _findRole(collection: MashroomStorageCollection<MashroomSecurityRoleDefinition>, id: string): Promise<MashroomSecurityRoleDefinition | undefined | null> {
        return collection.findOne({id});
    }

    private async _getRoleDefinitionsCollection(request: Request): Promise<MashroomStorageCollection<MashroomSecurityRoleDefinition>> {
        const storageService = request.pluginContext.services.storage.service;
        return storageService.getCollection(ROLE_DEFINITIONS_COLLECTION_NAME);
    }

    private async _createNewSession(request: Request): Promise<void> {
        const logger: MashroomLogger = request.pluginContext.loggerFactory('mashroom.security.service');
        logger.debug('Invalidating session');

        return new Promise((resolve) => {
            request.session.regenerate((err: Error | null) => {
                if (err) {
                    logger.warn('Session invalidation failed!', err);
                }
                resolve();
            });
        })
    }

    private _getAuthenticationHints(request: Request): any {
        const {query} = request;
        const forwardQueryParams = this._forwardQueryHintsToProvider;
        const hints: any = {};
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

    private _removeAuthenticationHintsFromUrl(request: Request, hints: any): void {
        const queryParams: any = {...request.query};
        Object.keys(hints).forEach((key) => delete queryParams[key]);
        const query = querystring.stringify(queryParams);

        request.url = request.url.split('?')[0] + (query ? `?${query}` : '');
        request.originalUrl = request.originalUrl.split('?')[0] + (query ? `?${query}` : '');
    }
}

