
# Mashroom OpenID Connect Security Provider

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin adds an OpenID Connect/OAuth2 security provider that can be used to integrate *Mashroom Server* with almost
all Identity Providers or Identity Platforms.

Tested with:

 * [Keylcoak](https://www.keycloak.org)
 * [Authentic](https://goauthentik.io)
 * [Open AM](https://github.com/OpenIdentityPlatform/OpenAM)
 * [Google Identity Platform](https://developers.google.com/identity)
 * [Github OAuth 2.0](https://developer.github.com/v3/oauth)

But should work with any other OIDC/OAuth2 provider as well.

## Usage

If *node_modules/@mashroom* is configured as a plugin path, add **@mashroom/mashroom-security-provider-openid-connect** as *dependency*.

To activate this provider, configure the [Mashroom Security](../mashroom-security) plugin like this:

```json
{
    "plugins": {
        "Mashroom Security Services": {
            "provider": "Mashroom OpenID Connect Security Provider"
        }
    }
}
```

And configure this plugin like this in the server config file:

```json
{
    "plugins": {
        "Mashroom OpenID Connect Security Provider": {
            "mode": "OIDC",
            "issuerDiscoveryUrl": "http://localhost:8080/.well-known/openid-configuration",
            "issuerMetadata": null,
            "scope": "openid email profile",
            "clientId": "mashroom",
            "clientSecret": "your-client-secret",
            "redirectUrl": "http://localhost:5050/openid-connect-cb",
            "usePKCE": false,
            "extraAuthParams": {},
            "extraDataMapping": {
                "phone": "phone",
                "birthdate": "birthdate",
                "updatedAt": "updated_at"
            },
            "rolesClaimName": "roles",
            "adminRoles": [
                "mashroom-admin"
            ],
            "httpRequestTimeoutMs": 3500
        },
        "Mashroom OpenID Connect Security Provider Callback": {
           "path": "/openid-connect-cb"
        }
    }
}
```

 * _mode_: Can be _OIDC_ (default) or _OAuth2_. Pure OAuth2 usually does not support permission roles (for authorization).
 * _issuerDiscoveryUrl_: The [OpenID Connect Discovery URL](https://openid.net/specs/openid-connect-discovery-1_0.html), this is usually https://&lt;your-idp-host&gt;/.well-known/openid-configuration. See Example Configurations below.
 * _issuerMetadata_: The issuer metadata (only) if no _issuerDiscoveryUrl_ is available. Must be of type [ServerMetadata](https://github.com/panva/openid-client/blob/main/docs/interfaces/ServerMetadata.md) (Default: null)
 * _scope_: The scope (permissions) to ask for (Default: openid email profile)
 * _clientId_: The client to use (Default: mashroom)
 * _clientSecret_: The client secret
 * _redirectUrl_: The full URL of the callback (as seen from the user). This is usually https://&lt;mashroom-server-host&gt;/openid-connect-cb.
   The path corresponds with the _path_ property in the *Mashroom OpenID Connect Security Provider Callback* config.
 * _usePKCE_: Use the [Proof Key for Code Exchange](https://oauth.net/2/pkce) extension for the _code_ flow (Default: false)
 * _extraAuthParams_: Extra authentication parameters that should be used
 * _extraDataMapping_: Optionally map extra claims to _user.extraData_. The key in the map is the extraData property, the value the claim name (Default: null)
 * _rolesClaimName_: Defines the name of the claim (the property of the claims or userinfo object) that contains the user roles array (Default: roles)
 * _adminRoles_: A list of user roles that should get the Mashroom _Administrator_ role (Default: ["mashroom-admin"])
 * _httpRequestTimeoutMs_: Request timeout when contacting the Authorization Server (Default: 3500)

### Roles

Since the authorization mechanism relies on user roles, it is necessary to configure your identity provider to map the user
roles to a scope (which means we can get it as claim). See Example Configurations below.

### Secrets

The plugin maps the ID/JWT Token to _user.secrets.idToken_ so it can, for example, be used in a Http Proxy Interceptor to set
the Bearer for backend calls.

### Authentication Expiration

The implementation automatically extends the authentication via refresh token every view seconds (as long as the user is active).
So, if the authentication session gets revoked in the identity provider, the user is signed out almost immediately.

The expiration time of the access token defines after which time the user is automatically signed out due to inactivity.
And the expiration time of the refresh token defines how long the user can work without signing in again.

> [!IMPORTANT]
> HTTP *issuerDiscoveryUrl*s are only allowed in dev mode.

## Example Configurations

### Keycloak

Setup:

 * Create a new client in your realm (e.g. *mashroom*)
 * In the *Settings* tab set Access Type *confidential*
 * Make sure the *Valid Redirect URIs* contain your redirect URL (e.g., http://localhost:5050/*)
 * In the *Credentials* tab you'll find the client secret
 * To map the roles to a scope/claim goto *Mappers*, click *Add Builtin* and add a *realm roles* mapper.
   In the field *Token Claim Name* enter *roles*. Also check *Add to ID token*.
 * You should create a role (e.g. *mashroom-admin*) for users with Administrator rights

You'll find more details about the configuration here: [https://www.keycloak.org/documentation.html](https://www.keycloak.org/documentation.html)

If your Keycloak runs on localhost, the Realm name is *test* amd the client name *mashroom*, then the config would look like this:

```json
{
    "plugins": {
        "Mashroom OpenID Connect Security Provider": {
            "issuerDiscoveryUrl": "http://localhost:8080/auth/realms/test/.well-known/uma2-configuration",
            "clientId": "<client-id>",
            "clientSecret": "<client-secret>",
            "redirectUrl": "http://localhost:5050/openid-connect-cb",
            "rolesClaimName": "roles",
            "adminRoles": [
                "mashroom-admin"
            ]
        }
    }
}
```

### Authentik

Setup:

 * Create a new application with an arbitrary name (e.g., mashroom)
 * Select Oauth2/OpenID Provider
 * Authorization Flow: provider-authorization-explicit-consent
 * Client Type: Confidential
 * Redirect URI: Add http://localhost:5050/openid-connect-cb
 * You should create a role (e.g. *mashroom-admin*) for users with Administrator rights

If your Autentic server runs on localhost and the application name is mashroom, then the config would look like this:

```json
{
    "plugins": {
        "Mashroom OpenID Connect Security Provider": {
            "issuerDiscoveryUrl": "http://localhost:9000/application/o/mashroom/.well-known/openid-configuration",
            "scope": "openid email profile",
            "clientId": "<client-id>",
            "clientSecret": "<client-secret>",
            "redirectUrl": "http://localhost:5050/openid-connect-cb",
            "rolesClaimName": "groups",
            "adminRoles": [
                "mashroom-admin"
            ]
        }
    }
}
```

### OpenAM

Setup:

 * Create a new Realm (e.g. *Test*)
 * Create a new OIDC configuration: OAuth provider → Configure OpenID Connect → Create from the Dashboard)
 * Create a new Agent (e.g. *mashroom*): Applications → OAuth 2.0 → Agent from the Dashboard)
 * Make sure the agent has at least the scopes *openid email profile* and the *ID Token Signing Algorithm* is set to *RS256*
 * Make sure the agents *Token Endpoint Authentication Method* is set to *client_secret_post*
 * Make sure the *Redirect URIs* contain your redirect URL (e.g.,
 * Follow [this KB article](https://backstage.forgerock.com/knowledge/kb/article/a15751293) to add the OpenAM groups as role claim

You'll find more details about the configuration here: [https://backstage.forgerock.com/docs/openam/13.5/admin-guide](https://backstage.forgerock.com/docs/openam/13.5/admin-guide/#chap-openid-connect)

If your OpenAM server runs on localhost, the Realm name is *Test* and the client name *mashroom*, then the config would look like this:

```json
{
    "plugins": {
        "Mashroom OpenID Connect Security Provider": {
            "issuerDiscoveryUrl": "http://localhost:8080/openam/oauth2/Test/.well-known/openid-configuration",
            "scope": "openid email profile",
            "clientId": "mashroom",
            "clientSecret": "<client-secret>",
            "usePKCE": true,
            "redirectUrl": "http://localhost:5050/openid-connect-cb",
            "rolesClaimName": "roles",
            "adminRoles": [
                "mashroom-admin"
            ]
        }
    }
}
```

### Google Identity Platform

Setup:

 * Go to: [https://console.developers.google.com](https://console.developers.google.com)
 * Select *Credentials* from the menu and then the auto created client under *OAuth 2.0 Client IDs*
 * Make sure the *Authorized* redirect URIs contains your redirect URL (e.g. http://localhost:5050/openid-connect-cb)
 * Create a *OAuth consent screen*

Possible config:

```json
{
    "plugins": {
        "Mashroom OpenID Connect Security Provider": {
            "issuerDiscoveryUrl": "https://accounts.google.com/.well-known/openid-configuration",
            "scope": "openid email profile",
            "clientId": "<client-id>",
            "clientSecret": "<client-secret>",
            "redirectUrl": "http://localhost:5050/openid-connect-cb",
            "extraAuthParams": {
                "access_type": "offline"
            },
            "usePKCE": true
        }
    }
}
```

The *access_type=offline* parameter is necessary to get a refresh token.

Since Google users don't have authorization roles, there is no way to make some users _Administrator_.

### GitHub OAuth2

Setup:

 * Go to: [https://github.com/settings/developers](https://github.com/settings/developers)
 * Click on "New OAuth App"
 * Enter the application name and correct callback URL (e.g., http://localhost:5050/openid-connect-cb)

Example configuration:

```json
{
    "plugins": {
        "Mashroom OpenID Connect Security Provider": {
            "mode": "OAuth2",
            "issuerDiscoveryUrl": "https://github.com/login/oauth/.well-known/openid-configuration",
            "scope": "read:user",
            "clientId": "<client-id>",
            "clientSecret": "<client-secret>",
            "redirectUrl": "http://localhost:5050/openid-connect-cb"
        }
    }
}
```

Since GitHub uses pure OAuth2 the users don't have permission roles and there is no way to make some users _Administrator_.
Also, it seems there is no way to get the username and email address as claims.
