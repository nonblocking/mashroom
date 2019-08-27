// @flow

import type {
    MashroomPluginContextHolder,
    ExpressRequest,
    ExpressMiddleware,
    MashroomPluginConfig, ExpressResponse,
} from '@mashroom/mashroom/type-definitions';

export type MashroomSecurityRoleDefinition = {
    id: string,
    description?: string
}

export type MashroomSecurityRole = 'User' | 'Administrator' | string;
export type MashroomSecurityRoles = Array<MashroomSecurityRole>;
export type MashroomSecurityPermission = 'View' | 'Create' | 'Edit' | 'Delete';
export type MashroomSecurityPermissions = Array<MashroomSecurityPermission>;

export type MashroomSecurityUser = {
    +username: string,
    +displayName: ?string,
    +roles: MashroomSecurityRoles,
    /*
     * Headers that shall be passed to backends for this user (e.g. REST APIs).
     * For example, in case of OAuth this could be a Bearer Authentication header.
     */
    +extraHttpHeaders?: {
        [headerName: string]: string
    },
    +[string]: any
}

export type MashroomSecurityResourceType = 'Page' | 'Portal-App' | string;

export type MashroomSecurityProtectedResource = {
    type: MashroomSecurityResourceType,
    key: string,
    permissions: ?MashroomSecurityResourcePermissions;
};

export type MashroomSecurityResourcePermission = {
    +roles: MashroomSecurityRoles,
    +permissions: MashroomSecurityPermissions
}

export type MashroomSecurityResourcePermissions = Array<MashroomSecurityResourcePermission>;

export type MashroomSecurityLoginResult = {
    +success: boolean
}

export type MashroomSecurityAuthenticationResult = {
    +status: 'authenticated' | 'error' | 'deferred'
}

export interface MashroomSecurityService {
    /**
     * Get the current user or null if the user is not authenticated
     */
    getUser(request: ExpressRequest): ?MashroomSecurityUser;
    /**
     * Checks if user != null
     */
    isAuthenticated(request: ExpressRequest): boolean;
    /**
     * Check if the currently authenticated user has given role
     */
    isInRole(request: ExpressRequest, roleName: string): boolean;
    /**
     * Check if the currently authenticated user is an admin (has the role Administrator)
     */
    isAdmin(request: ExpressRequest): boolean;
    /**
     * Check the request against the ACL
     */
    checkACL(request: ExpressRequest): Promise<boolean>;
    /**
     * Check if given abstract "resource" is permitted for currently authenticated user.
     * The permission has to be defined with updateResourcePermission() first, otherwise the allowIfNoResourceDefinitionFound flag defines the outcome.
     */
    checkResourcePermission(request: ExpressRequest, resourceType: MashroomSecurityResourceType, resourceKey: string, permission: MashroomSecurityPermission, allowIfNoResourceDefinitionFound?: boolean): Promise<boolean>;
    /**
     * Set a resource permission for given abstract resource.
     * A resource could be: {type: 'Page', key: 'home', permissions: [{ roles: ['User'], permissions: ['VIEW'] }]}
     */
    updateResourcePermission(request: ExpressRequest, resource: MashroomSecurityProtectedResource): Promise<void>;
    /**
     * Get the permission definition for given resource, if any.
     */
    getResourcePermissions(request: ExpressRequest, resourceType: MashroomSecurityResourceType, resourceKey: string): Promise<?MashroomSecurityProtectedResource>;
    /**
     * Add a role definition
     */
    addRoleDefinition(request: ExpressRequest, roleDefinition: MashroomSecurityRoleDefinition): Promise<void>;
    /**
     * Get all known roles. Returns all roles added with addRoleDefinition() or implicitly added bei updateResourcePermission().
     */
    getExistingRoles(request: ExpressRequest): Promise<Array<MashroomSecurityRoleDefinition>>;
    /**
     * Start authentication process
     */
    authenticate(request: ExpressRequest, response: ExpressResponse): Promise<MashroomSecurityAuthenticationResult>;
    /**
     * Check the existing authentication (if any)
     */
    checkAuthentication(request: ExpressRequest): Promise<void>;
    /**
     * Get the authentication expiration time in unix time ms
     */
    getAuthenticationExpiration(request: ExpressRequest): ?number;
    /**
     * Revoke the current authentication
     */
    revokeAuthentication(request: ExpressRequest): Promise<void>;
    /**
     * Login user with given credentials (for form login).
     */
    login(request: ExpressRequest, username: string, password: string): Promise<MashroomSecurityLoginResult>;
}

export interface MashroomSecurityProvider {
    /**
     * Start authentication process.
     * This typically means to redirect to the login page, then you should return status: 'deferred'.
     * This could also automatically login via SSO, then you should return status: 'authenticated'.
     */
    authenticate(request: ExpressRequest, response: ExpressResponse): Promise<MashroomSecurityAuthenticationResult>;
    /**
     * Check the existing authentication (if any).
     * Use this to extend the authentication expiration or to periodically refresh the access token.
     *
     * This methods gets called for almost every requests, so do nothing expensive here.
     */
    checkAuthentication(request: ExpressRequest): Promise<void>;
    /**
     * Get the authentication expiration time in unix time ms. Return null/undefined if there is no authentication.
     */
    getAuthenticationExpiration(request: ExpressRequest): ?number;
    /**
     * Revoke the current authentication.
     * That typically means to remove the user object from the session.
     */
    revokeAuthentication(request: ExpressRequest): Promise<void>;
    /**
     * Programmatically login user with given credentials (optional, but necessary if you use the default login page)
     */
    login(request: ExpressRequest, username: string, password: string): Promise<MashroomSecurityLoginResult>;
    /**
     * Get the current user or null if the user is not authenticated
     */
    getUser(request: ExpressRequest): ?MashroomSecurityUser;
}

export interface MashroomSecurityMiddleware {
    middleware(): ExpressMiddleware
}

export interface MashroomSecurityProviderRegistry {
    +providers: Array<MashroomSecurityProvider>;
    findProvider(pluginName: string): ?MashroomSecurityProvider;
    register(pluginName: string, provider: MashroomSecurityProvider): void;
    unregister(pluginName: string): void;
}

/*
 * ACL security
 */

export type HttpMethod = '*' | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';

export type MashroomSecurityACLPathRulePermission = {
    +allow?: MashroomSecurityRoles,
    +deny?: MashroomSecurityRoles
}

export type MashroomSecurityACLPathRule = {
    +[method: HttpMethod]: MashroomSecurityACLPathRulePermission
}

export type MashroomSecurityACL = {
    +[pathPattern: string]: MashroomSecurityACLPathRule
}

export interface MashroomSecurityACLChecker {
   allowed(req: ExpressRequest, userPrincipal: ?MashroomSecurityUser): Promise<boolean>;
}

/*
 * Bootstrap method definition for security-provider plugins
 */
export type MashroomSecurityProviderPluginBootstrapFunction = (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) => Promise<MashroomSecurityProvider>;
