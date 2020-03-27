
# Mashroom Security

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

This plugin adds role based security to the _Mashroom Server_. It allows to restrict the access to certain paths
via ACL and provides a service to manage the access to resources.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-security** as *dependency*.

After that you can add a _acl.json_ file to your server config folder with a content like this:

```json
{
    "/portal/**": {
        "*": {
            "allow": ["Authenticated"]
        }
    },
    "/foo/bar/**": {
        "DELETE": {
            "deny": ["NotSoTrustedRole"]
        }
    }
}
```

The general structure is:

```json
{
    "URL_PATTERN": {
        "*|GET|POST|PUT|DELETE|PATCH|OPTIONS": {
            "allow": ["Role1", "Role2"],
            "deny": ["Role3"]
        }
    }
}
```

Where the URL_PATTERN can contain "\*" for a single path segment and "\*\*" for an arbitrary number of segments.
Instead of a list of roles you can also use "\*" for all users (even anonymous ones):

```json
{
    "/portal/public/**": {
        "*": {
            "allow": "*"
        }
    }
}
```

And you can use the security service like this:

```js
// @flow

import type {MashroomSecurityService} from '@mashroom/mashroom-security/type-definitions';

export default async (req: ExpressRequest, res: ExpressResponse) => {
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

You can override the default config in your Mashroom config file like this:

```json
{
  "plugins": {
        "Mashroom Security Services": {
            "provider": "Mashroom Security Simple Provider",
            "acl": "./acl.json"
        }
    }
}
```

 * _provider_: The plugin that actually does the authentication and knows how to retrieve the user roles (Default: Mashroom Security Simple Provider)
 * _acl_: The ACL for path based security restrictions (see below) (default: ./acl.json)

## Services

### MashroomSecurityService

The exposed service is accessible through _pluginContext.services.security.service_

**Interface:**

```js
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
     * Revoke the current authentication
     */
    revokeAuthentication(request: ExpressRequest): Promise<void>;
    /**
     * Login user with given credentials (for form login).
     */
    login(request: ExpressRequest, username: string, password: string): Promise<MashroomSecurityLoginResult>;
}
```

## Plugin Types

### security-provider

Registers a Security Provider that can be used by this plugin.

To register a security-provider plugin add this to _package.json_:

```json
{
    "mashroom": {
        "plugins": [
            {
                "name": "My Custom Security Provider",
                "type": "security-provider",
                "bootstrap": "./dist/mashroom-bootstrap",
                "defaultConfig": {
                   "myProperty": "foo"
                }
            }
        ]
    }
}
```

The bootstrap returns the provider:

```js
// @flow

import type {MashroomSecurityProviderPluginBootstrapFunction} from '@mashroom/mashroom-security/type-definitions';

const bootstrap: MashroomSecurityProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {

    return new MySecurityProvider(/* ... */);
};

export default bootstrap;
```

Which has to implement the following interface:

```js
export interface MashroomSecurityProvider {
    /**
     * Start authentication process.
     * This typically means to redirect to the login page, then you should return status: 'deferred'.
     * This could also automatically login via SSO, then you should return status: 'authenticated'.
     */
    authenticate(request: ExpressRequest, response: ExpressResponse): Promise<MashroomSecurityAuthenticationResult>;
    /**
     * Revoke the current authentication.
     * That typically means to remove the user object from the session.
     */
    revokeAuthentication(request: ExpressRequest): Promise<void>;
    /**
     * Login user with given credentials (for form login, if supported)
     */
    login(request: ExpressRequest, username: string, password: string): Promise<MashroomSecurityLoginResult>;
    /**
     * Get the current user or null if the user is not authenticated
     */
    getUser(request: ExpressRequest): ?MashroomSecurityUser;
}
```

