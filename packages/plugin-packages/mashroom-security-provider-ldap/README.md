
### Mashroom LDAP Security Provider

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**. 

This plugin adds a LDAP security provider.

#### Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-security-provider-ldap** as *dependency*.

To activate this provider configure the _Mashroom Security_ plugin like this:

```json
{
    "plugins": {
        "Mashroom Security Services": {
            "provider": "Mashroom LDAP Security Provider"
        }
    }
}
```

And configure this plugin like this in the Mashroom config file:

```json
{
    "plugins": {
        "Mashroom LDAP Security Provider": {
            "loginPage": "/login",
            "serverUrl": "ldap://my-ldap-server:636",
            "bindDN": "admin",
            "bindCredentials": "secret",
            "baseDN": "OU=Mashroom",
            "userSearchFilter": "(&(objectClass=person)(uid=@username@))",
            "groupSearchFilter": "(objectClass=group)",
            "groupToRoleMapping": "./groupToRoleMapping.json",
            "authenticationTimeoutSec": 1200
        }
    }
}
```

 * _loginPage_: The login URL when user is not authenticated (must match the path of _Mashroom Security Default Login Webapp_)
 * _serverUrl_: The LDAP server URL with protocol and port
 * _tlsOptions_: Optional TLS options if your LDAP server requires TLS. The options are passed to [Node TLS](https://nodejs.org/api/tls.html),
    but the file paths (e.g. for "cert") are resolved relatively to _mashroom.json_.
 * _bindDN_: The bind user for searching
 * _bindCredentials_: The password for the bind user
 * _baseDN_: The base DN for searches (can be empty)
 * _userSearchFilter_: The user search filter, _@username@_ will be replaced by the actual username entered in the login form
 * _groupSearchFilter_: The group search filter (can be empty if you don't want to fetch the user groups)
 * _groupToRoleMapping_: An optional JSON file that contains a user group to roles mapping
 * _authenticationTimeoutSec_: The inactivity time after that the authentication expires. Since this plugin uses the session to store make sure the session _cookie.maxAge_ is greater than this value.
 
For a server that requires TLS you have to provide a _tlsOptions_ object:

```json
{
    "plugins": {
        "Mashroom LDAP Security Provider": {
            "serverUrl": "ldaps://my-ldap-server:636",
            "tlsOptions": {
              "cert": "./server-cert.pem",
              
              // Necessary only if the server requires client certificate authentication.
              //"key": "./client-key.pem",
            
              // Necessary only if the server uses a self-signed certificate.
              // "rejectUnauthorized": false,
              // "ca": [ "./server-cert.pem" ],
            }
        }
    }
}
```

The _groupToRoleMapping_ file has to following simple structure:

```json
{
    "LDAP_GROUP1": [
        "ROLE1",
        "ROLE2"
    ]
}
```

