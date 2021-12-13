
# Mashroom Security

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin adds role based security to the _Mashroom Server_.

It comes with the following mechanisms:

 * A new *Security Provider* plugin type that does the actual authentication and can be used to obtain the user roles
 * An access control list (ACL) based on a JSON file that can be used to protect paths and HTTP methods based on roles or IP addresses
 * A middleware that checks for every request the ACL and if authentication and specific roles are required.
   If authentication is required and no user present it triggers an authentication (via *Security Provider*).
 * A shared service to programmatically restrict the access to resources such as Pages or Apps (used by the *Mashroom Portal*)

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-security** as *dependency*.

You can override the default config in your Mashroom config file like this:

```json
{
  "plugins": {
        "Mashroom Security Services": {
            "provider": "Mashroom Security Simple Provider",
            "forwardQueryHintsToProvider": [],
            "acl": "./acl.json"
        }
    }
}
```

 * _provider_: The plugin that actually does the authentication and knows how to retrieve the user roles (Default: Mashroom Security Simple Provider)
 * _forwardQueryHintsToProvider_: A list of query parameters that should be forwarded during the authentication.
   (will be added to the login or authorization URL).
 * _acl_: The ACL for path based security restrictions (see below) (Default: ./acl.json)

### ACL

A typical ACL configuration looks like this:

```json
{
    "$schema": "https://www.mashroom-server.com/schemas/mashroom-security-acl.json",
    "/portal/**": {
        "*": {
            "allow": {
                "roles": ["Authenticated"]
            }
        }
    },
    "/mashroom/**": {
        "*": {
            "allow": {
                "roles": ["Administrator"],
                "ips": ["127.0.0.1", "::1"]
            }
        }
    }
}
```

The general structure is:

```
    "/my/path/**": {
        "*|GET|POST|PUT|DELETE|PATCH|OPTIONS": {
            "allow": "any"|<array of roles>|<object with optional properties roles and ips>
            "deny": "any"|<array of roles>|<object with optional properties roles and ips>
        }
    }
```

 * The path can contain the wildcard "\*" for single segments and  "\*\*" for multiple segments
 * "any" includes anonymous users
 * IP addresses can also contain wildcards: "?" for s single digit, "\*" for single segments and  "\*\*" for multiple segments

Example: Allow all users except the ones that come from an IP address starting with 12:

```json
{
    "/my-app/**": {
        "*": {
            "allow": {
                "roles": ["Authenticated"]
            },
            "deny": {
                "ips": ["12.**"]
            }
        }
    }
}
```

Example: Restrict the Portal to authenticated users but make a specific site public:

```json
{
    "/portal/public-site/**": {
        "*": {
            "allow": "any"
        }
    },
    "/portal/**": {
        "*": {
            "allow": {
                "roles": ["Authenticated"]
            }
        }
    }
}
```

### Security Service

Adding and checking a resource permission (e.g. for a Page) works like this:

```ts
import type {MashroomSecurityService} from '@mashroom/mashroom-security/type-definitions';

export default async (req: Request, res: Response) => {
    const securityService: MashroomSecurityService = req.pluginContext.services.security.service;

    // Create a permission
    await securityService.updateResourcePermission(req, {
        type: 'Page',
        key: pageId,
        permissions: [{
            permissions: ['View'],
            roles: ['Role1', 'Role2']
        }]
    });

    // Check a permission
    const mayAccess = await securityService.checkResourcePermission(req, 'Page', pageId, 'View');

    // ...
}
```

## Services

### MashroomSecurityService

The exposed service is accessible through _pluginContext.services.security.service_

**Interface:**

```ts
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
    checkResourcePermission(
        request: Request,
        resourceType: MashroomSecurityResourceType,
        resourceKey: string,
        permission: MashroomSecurityPermission,
        allowIfNoResourceDefinitionFound?: boolean,
    ): Promise<boolean>;

    /**
     * Set a resource permission for given abstract resource.
     * A resource could be: {type: 'Page', key: 'home', permissions: [{ roles: ['User'], permissions: ['VIEW'] }]}
     */
    updateResourcePermission(
        request: Request,
        resource: MashroomSecurityProtectedResource,
    ): Promise<void>;

    /**
     * Get the permission definition for given resource, if any.
     */
    getResourcePermissions(
        request: Request,
        resourceType: MashroomSecurityResourceType,
        resourceKey: string,
    ): Promise<MashroomSecurityProtectedResource | null | undefined>;

    /**
     * Add a role definition
     */
    addRoleDefinition(
        request: Request,
        roleDefinition: MashroomSecurityRoleDefinition,
    ): Promise<void>;

    /**
     * Get all known roles. Returns all roles added with addRoleDefinition() or implicitly added bei updateResourcePermission().
     */
    getExistingRoles(
        request: Request,
    ): Promise<Array<MashroomSecurityRoleDefinition>>;

    /**
     * Check if an auto login would be possible.
     */
    canAuthenticateWithoutUserInteraction(request: Request): Promise<boolean>;

    /**
     * Start authentication process
     */
    authenticate(
        request: Request,
        response: Response,
    ): Promise<MashroomSecurityAuthenticationResult>;

    /**
     * Check the existing authentication (if any)
     */
    checkAuthentication(request: Request): Promise<void>;

    /**
     * Get the authentication expiration time in unix time ms
     */
    getAuthenticationExpiration(
        request: Request,
    ): number | null | undefined;

    /**
     * Revoke the current authentication
     */
    revokeAuthentication(request: Request): Promise<void>;

    /**
     * Login user with given credentials (for form login).
     */
    login(
        request: Request,
        username: string,
        password: string,
    ): Promise<MashroomSecurityLoginResult>;

    /**
     * Find a security provider by name.
     * Useful if you want to dispatch the authentication to a different provider.
     */
    getSecurityProvider(name: string): MashroomSecurityProvider | null | undefined;
}
```

## Plugin Types

### security-provider

This plugin type is responsible for the actual authentication and for creating a user object with a list of roles.

To register your custom security-provider plugin add this to _package.json_:

```json
{
    "mashroom": {
        "plugins": [
            {
                "name": "My Custom Security Provider",
                "type": "security-provider",
                "bootstrap": "./dist/mashroom-bootstrap.js",
                "defaultConfig": {
                   "myProperty": "foo"
                }
            }
        ]
    }
}
```

The bootstrap returns the provider:

```ts
import type {MashroomSecurityProviderPluginBootstrapFunction} from '@mashroom/mashroom-security/type-definitions';

const bootstrap: MashroomSecurityProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {

    return new MySecurityProvider(/* ... */);
};

export default bootstrap;
```

The provider has to implement the following interface:

```ts
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
    authenticate(
        request: Request,
        response: Response,
        authenticationHints?: any,
    ): Promise<MashroomSecurityAuthenticationResult>;

    /**
     * Check the existing authentication (if any).
     * Use this to extend the authentication expiration or to periodically refresh the access token.
     *
     * This methods gets called for almost every requests, so do nothing expensive here.
     */
    checkAuthentication(request: Request): Promise<void>;

    /**
     * Get the authentication expiration time in unix time ms. Return null/undefined if there is no authentication.
     */
    getAuthenticationExpiration(
        request: Request,
    ): number | null | undefined;

    /**
     * Revoke the current authentication.
     * That typically means to remove the user object from the session.
     */
    revokeAuthentication(request: Request): Promise<void>;

    /**
     * Programmatically login user with given credentials (optional, but necessary if you use the default login page)
     */
    login(
        request: Request,
        username: string,
        password: string,
    ): Promise<MashroomSecurityLoginResult>;

    /**
     * Get the current user or null if the user is not authenticated
     */
    getUser(request: Request): MashroomSecurityUser | null | undefined;
}
```

