
# Mashroom OpenID Connect Security Provider

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

This plugin adds a OpenID Connect/OAuth2 security provider that can be used to integrate *Mashroom Server* with almost
all Identity Providers or Identity Platforms.

Tested with:
 * [Github OAuth 2.0](https://developer.github.com/v3/oauth)
 * [Google Identity Platform](https://developers.google.com/identity)
 * [Keylcoak Identity Provider](https://www.keycloak.org)
 * [Open AM](https://backstage.forgerock.com/docs/openam/13.5/admin-guide/#chap-openid-connect)

Should work with (among others):
 * [Auth0](https://auth0.com/docs/protocols/oidc)
 * [Facebook Login](https://developers.facebook.com/docs/facebook-login)
 * [Gluu](https://gluu.org/docs/ce/api-guide/openid-connect-api)
 * [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-overview)
 * [Okta](https://developer.okta.com/docs/reference/api/oidc)
 * [OneLogin](https://developers.onelogin.com/openid-connect)
 * [PingIdentity](https://www.pingidentity.com/developer/en/resources/openid-connect-developers-guide.html)

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-security-provider-ldap** as *dependency*.

To activate this provider configure the _Mashroom Security_ plugin like this:

```json
{
    "plugins": {
        "Mashroom Security Services": {
            "provider": "Mashroom OpenID Connect Security Provider"
        }
    }
}
```

And configure this plugin like this in the Mashroom config file:

```json
{
    "plugins": {
        "Mashroom OpenID Connect Security Provider": {
            "mode": "OIDC",
            "issuerDiscoveryUrl": "http://localhost:8080/.well-known/openid-configuration",
            "issuerMetadata": null,
            "rejectUnauthorized": true,
            "scope": "openid email profile",
            "clientId": "mashroom",
            "clientSecret": "your-client-secret",
            "redirectUrl": "http://localhost:5050/openid-connect-cb",
            "responseType": "code",
            "usePKCE": "false",
            "extraAuthParams": {},
            "rolesClaim": "roles",
            "adminRoles": [
                "mashroom-admin"
            ]
        },
        "Mashroom OpenID Connect Security Provider Callback": {
           "path": "/openid-connect-cb"
        }
    }
}
```

 * _mode_: Can be _OIDC_ (default) or _OAuth2_. Pure OAuth2 usually does not support permission roles (for authorization).
 * _issuerDiscoveryUrl_: The [OpenID Connect Discovery URL](https://openid.net/specs/openid-connect-discovery-1_0.html), this is usually https://&lt;your-idp-host&gt;/.well-known/openid-configuration. See Example Configurations below.
 * _issuerMetadata_: The issuer metadata if no _issuerDiscoveryUrl_ is available. Will be passed to the [Issuer constructor](https://github.com/panva/node-openid-client/blob/master/docs/README.md#issuer). See examples below.
 * _rejectUnauthorized_: Reject self-signed certificates (Default: true)
 * _scope_: The scope (permissions) to ask for (Default: openid email profile)
 * _clientId_: The client to use (Default: mashroom)
 * _clientSecret_: The client secret
 * _redirectUrl_: The full URL of the callback (as seen from the user). This is usually https://&lt;mashroom-server-host&gt;/openid-connect-cb.
   The path corresponds with the _path_ property in the *Mashroom OpenID Connect Security Provider Callback* config.
 * _responseType_: The OpenID Connect response type (flow) to use (Default: code)
 * _usePKCE_: Use the [Proof Key for Code Exchange](https://oauth.net/2/pkce) extension for the _code_ flow
 * _extraAuthParams_: Extra authentication parameters that should be used
 * _rolesClaimName_: Defines the name of the claim (the property of the claims or userinfo object) that contains the user roles array
 * _adminRoles_: A list of user roles that should get the Mashroom _Administrator_ role

### Roles

Since the authorization mechanism relies on user roles it is necessary to configure your identity provider to map the user
roles to a scope (which means we can get it as claim). See Example Configurations below.

### Authentication Expiration

The implementation automatically extends the authentication via refresh token every view seconds (as long as the user is active).
So, if the authentication session gets revoked in the identity provider the user is signed out almost immediately.

The expiration time of the access token defines after which time the user is automatically signed out due to inactivity.
And the expiration time of the refresh token defines how long the user can work without signing in again.

## Example Configurations

### Keycloak

Setup:

 * Create a new client in your realm (e.g. *mashroom*)
 * In the *Settings* tab set Access Type *confidential*
 * Make sure the *Valid Redirect URIs* contains your redirect URL (e.g. http://localhost:5050/*)
 * In the *Credentials* tab you'll find the client secret
 * To map the roles to a scope/claim goto *Mappers*, click *Add Builtin* and add a *realm roles* mapper.
   In the field *Token Claim Name* enter *roles*. Also check *Add to ID token*.

You'll find more details about the configuration here: [https://www.keycloak.org/documentation.html](https://www.keycloak.org/documentation.html)

If your Keycloak runs on localhost, the Realm name is *test* amd the client name *mashroom*, then the config would look like this:

```json
{
    "plugins": {
        "Mashroom OpenID Connect Security Provider": {
            "issuerDiscoveryUrl": "http://localhost:8080/auth/realms/test/.well-known/uma2-configuration",
            "clientId": "mashroom",
            "clientSecret": "xxxxxxxxxxxxxxxx",
            "redirectUrl": "http://localhost:5050/openid-connect-cb",
            "rolesClaim": "roles",
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
 * Create a new OIDC configuration: OAuth provider -> Configure OpenID Connect -> Create from the Dashboard)
 * Create a new Agent (e.g. *mashroom*): Applications -> OAuth 2.0 -> Agent from the Dashboard)
 * Make sure the agent has at least the scopes *openid email profile* and the *ID Token Signing Algorithm* is set to *RS256*
 * Follow [this KB article](https://backstage.forgerock.com/knowledge/kb/article/a15751293) to add the OpenAM groups as roles claim

You'll find more details about the configuration here: [https://backstage.forgerock.com/docs/openam/13.5/admin-guide](https://backstage.forgerock.com/docs/openam/13.5/admin-guide/#chap-openid-connect)

If your OpenAM server runs on localhost, the Realm name is *Test* amd the client name *mashroom*, then the config would look like this:

```json
{
    "plugins": {
        "Mashroom OpenID Connect Security Provider": {
            "issuerDiscoveryUrl": "http://localhost:8080/openam/oauth2/Test/.well-known/openid-configuration",
            "scope": "openid email profile",
            "clientId": "mashroom",
            "clientSecret": "mashroom",
            "redirectUrl": "http://localhost:5050/openid-connect-cb",
            "rolesClaim": "roles",
            "adminRoles": [
                "mashroom-admin"
            ]
        }
    }
}
```

### Google Identity Platform

Setup:

 * Go to: https://console.developers.google.com/
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
            "clientId": "xxxxxxxxxxxxxxxx.apps.googleusercontent.com",
            "clientSecret": "xxxxxxxxxxxxxxxx",
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

Since Google users don't have authorization roles there is no way to make some users _Administrator_.

### GitHub OAuth2

Setup:

 * Go to: https://github.com/settings/developers
 * Click on "New OAuth App"
 * Enter the application name and correct callback URL (e.g. http://localhost:5050/openid-connect-cb)

Possible config:

```json
{
    "plugins": {
        "Mashroom OpenID Connect Security Provider": {
            "mode": "OAuth2",
            "issuerMetadata": {
                "issuer": "GitHub",
                "authorization_endpoint": "https://github.com/login/oauth/authorize",
                "token_endpoint": "https://github.com/login/oauth/access_token",
                "userinfo_endpoint": "https://api.github.com/user",
                "end_session_endpoint": null
            },
            "scope": "openid email profile",
            "clientId": "xxxxxxxxxxxxxxxx",
            "clientSecret": "xxxxxxxxxxxxxxxx",
            "redirectUrl": "http://localhost:5050/openid-connect-cb"
        }
    }
}
```

Since GitHub uses pure OAuth2 the users don't have permission roles and there is no way to make some users _Administrator_.
It also supports no *userinfo* endpoint, so it actually makes not much sense to use it with *Mashroom*.
