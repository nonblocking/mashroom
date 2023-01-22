
import type {Request, Response} from 'express';
import type {
    MashroomPluginConfig,
    MashroomPluginContextHolder
} from '@mashroom/mashroom/type-definitions';

export type MashroomSecurityLoginFailureReason =
    | 'Login not supported'
    | 'Login not permitted'
    | 'User not found'
    | 'Invalid credentials'
    | 'Password expired'
    | 'Account expired'
    | 'Account disabled'
    | 'Account locked';

export type MashroomSecurityRoleDefinition = {
    id: string;
    description?: string;
};

export type MashroomSecurityRole = 'User' | 'Administrator' | string;
export type MashroomSecurityRoles = Array<MashroomSecurityRole>;
export type MashroomSecurityPermission = 'View' | 'Create' | 'Edit' | 'Delete';
export type MashroomSecurityPermissions = Array<MashroomSecurityPermission>;

export type MashroomSecurityUser = {
    readonly username: string;
    readonly displayName: string | null | undefined;
    readonly email: string | null | undefined;
    readonly pictureUrl: string | null | undefined;
    readonly extraData: Record<string, any> | null | undefined;
    readonly roles: MashroomSecurityRoles;
    readonly secrets: Record<string, any> | null | undefined;
};

export type MashroomSecurityResourceType = 'Page' | 'Portal-App' | string;

export type MashroomSecurityProtectedResource = {
    type: MashroomSecurityResourceType;
    key: string;
    permissions: MashroomSecurityResourcePermissions | null | undefined;
};

export type MashroomSecurityResourcePermission = {
    readonly roles: MashroomSecurityRoles;
    readonly permissions: MashroomSecurityPermissions;
};

export type MashroomSecurityResourcePermissions = Array<
    MashroomSecurityResourcePermission
    >;

export type MashroomSecurityLoginResult = {
    readonly success: boolean;
    readonly failureReason?: MashroomSecurityLoginFailureReason;
    readonly failureReasonDetails?: string;
};

export type MashroomSecurityAuthenticationResult = {
    readonly status: 'authenticated' | 'error' | 'deferred';
};

export interface MashroomSecurityService {
    /**
     * Get the current user or null if the user is not authenticated
     */
    getUser(request: Request): MashroomSecurityUser | null | undefined;

    /**
     * Checks if user != null
     */
    isAuthenticated(request: Request): boolean;

    /**
     * Check if the currently authenticated user has given role
     */
    isInRole(request: Request, roleName: string): boolean;

    /**
     * Check if the currently authenticated user is an admin (has the role Administrator)
     */
    isAdmin(request: Request): boolean;

    /**
     * Check the request against the ACL
     */
    checkACL(request: Request): Promise<boolean>;

    /**
     * Check if given abstract "resource" is permitted for currently authenticated user.
     * The permission has to be defined with updateResourcePermission() first, otherwise the allowIfNoResourceDefinitionFound flag defines the outcome.
     */
    checkResourcePermission(request: Request, resourceType: MashroomSecurityResourceType, resourceKey: string, permission: MashroomSecurityPermission, allowIfNoResourceDefinitionFound?: boolean): Promise<boolean>;

    /**
     * Set a resource permission for given abstract resource.
     * A resource could be: {type: 'Page', key: 'home', permissions: [{ roles: ['User'], permissions: ['VIEW'] }]}
     *
     * If you pass a permission with an empty roles array it actually gets removed from the storage.
     */
    updateResourcePermission(request: Request, resource: MashroomSecurityProtectedResource): Promise<void>;

    /**
     * Get the permission definition for given resource, if any.
     */
    getResourcePermissions(request: Request, resourceType: MashroomSecurityResourceType, resourceKey: string): Promise<MashroomSecurityProtectedResource | null | undefined>;

    /**
     * Add a role definition
     */
    addRoleDefinition(request: Request, roleDefinition: MashroomSecurityRoleDefinition): Promise<void>;

    /**
     * Get all known roles. Returns all roles added with addRoleDefinition() or implicitly added bei updateResourcePermission().
     */
    getExistingRoles(request: Request): Promise<Array<MashroomSecurityRoleDefinition>>;

    /**
     * Check if an auto login would be possible.
     */
    canAuthenticateWithoutUserInteraction(request: Request): Promise<boolean>;

    /**
     * Start authentication process
     */
    authenticate(request: Request, response: Response): Promise<MashroomSecurityAuthenticationResult>;

    /**
     * Check the existing authentication (if any)
     */
    checkAuthentication(request: Request): Promise<void>;

    /**
     * Get the authentication expiration time in unix time ms
     */
    getAuthenticationExpiration(request: Request): number | null | undefined;

    /**
     * Revoke the current authentication
     */
    revokeAuthentication(request: Request): Promise<void>;

    /**
     * Login user with given credentials (for form login).
     */
    login(request: Request, username: string, password: string): Promise<MashroomSecurityLoginResult>;

    /**
     * Find a security provider by name.
     * Useful if you want to dispatch the authentication to a different provider.
     */
    getSecurityProvider(name: string): MashroomSecurityProvider | null | undefined;
}

export interface MashroomSecurityProvider {
    /**
     * Check if an auto login would be possible.
     * This is used for public pages when an authentication is optional but nevertheless desirable.
     * It is safe to always return false.
     */
    canAuthenticateWithoutUserInteraction(request: Request): Promise<boolean>;
    /**
     * Start authentication process.
     * This typically means to redirect to the login page, then you should return status: 'deferred'.
     * This method could also automatically login the user, then you should return status: 'authenticated'.
     */
    authenticate(request: Request, response: Response, authenticationHints?: any): Promise<MashroomSecurityAuthenticationResult>;

    /**
     * Check the existing authentication (if any).
     * Use this to extend the authentication expiration or to periodically refresh the access token.
     *
     * This method gets called for almost every request, so do nothing expensive here.
     */
    checkAuthentication(request: Request): Promise<void>;

    /**
     * Get the authentication expiration time in unix time ms. Return null/undefined if there is no authentication.
     */
    getAuthenticationExpiration(request: Request): number | null | undefined;

    /**
     * Revoke the current authentication.
     * That typically means to remove the user object from the session.
     */
    revokeAuthentication(request: Request): Promise<void>;

    /**
     * Programmatically login user with given credentials (optional, but necessary if you use the default login page)
     */
    login(request: Request, username: string, password: string): Promise<MashroomSecurityLoginResult>;

    /**
     * Get the current user or null if the user is not authenticated
     */
    getUser(request: Request): MashroomSecurityUser | null | undefined;
}

/*
 * Bootstrap method definition for security-provider plugins
 */
export type MashroomSecurityProviderPluginBootstrapFunction = (
    pluginName: string,
    pluginConfig: MashroomPluginConfig,
    contextHolder: MashroomPluginContextHolder,
) => Promise<MashroomSecurityProvider>;
