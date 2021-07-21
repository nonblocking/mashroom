
# Mashroom LDAP Security Provider

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

This plugin adds a LDAP security provider.

## Usage

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
            "ldapConnectTimeout": 3000,
            "ldapTimeout": 5000,
            "bindDN": "uid=mashroom,dc=nonblocking,dc=at",
            "bindCredentials": "secret",
            "baseDN": "ou=users,dc=nonblocking,dc=at",
            "userSearchFilter": "(&(objectClass=person)(uid=@username@))",
            "groupSearchFilter": "(objectClass=group)",
            "extraDataMapping": {
                "mobile": "mobile",
                "address": "postalAddress"
            },
            "secretsMapping": {
                "internalUserId": "uid"
            },
            "groupToRoleMapping": "./groupToRoleMapping.json",
            "userToRoleMapping": "./userToRoleMapping.json",
            "authenticationTimeoutSec": 1200
        }
    }
}
```

 * _loginPage_: The login URL to redirect to if the user is not authenticated (Default: /login)
 * _serverUrl_: The LDAP server URL with protocol and port
 * _ldapConnectTimeout_: Connect timeout in ms (Default: 3000)
 * _ldapTimeout_: Timeout in ms (Default: 5000)
 * _tlsOptions_: Optional TLS options if your LDAP server requires TLS. The options are passed to [Node TLS](https://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener)
    but the file paths (e.g. for "cert") are resolved relatively to the server config.
 * _bindDN_: The bind user for searching
 * _bindCredentials_: The password for the bind user
 * _baseDN_: The base DN for searches (can be empty)
 * _userSearchFilter_: The user search filter, _@username@_ will be replaced by the actual username entered in the login form
 * _groupSearchFilter_: The group search filter (can be empty if you don't want to fetch the user groups)
 * _extraDataMapping_: Optionally map extra LDAP attributes to _user.extraData_. The key in the map is the extraData property, the value the LDAP attribute (Default: null)
 * _secretsMapping_: Optionally map extra LDAP attributes to _user.secrets_ (Default: null)
 * _groupToRoleMapping_: An optional JSON file that contains a user group to roles mapping (Default: /groupToRoleMapping.json)
 * _userToRoleMapping_: An optional JSON file that contains a user name to roles mapping (Default: /userToRoleMapping.json)
 * _authenticationTimeoutSec_: The inactivity time after that the authentication expires. Since this plugin uses the session to store make sure the session _cookie.maxAge_ is greater than this value (Default: 1200)

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
    "$schema": "https://www.mashroom-server.com/schemas/mashroom-security-ldap-provider-group-to-role-mapping.json",
    "LDAP_GROUP1": [
        "ROLE1",
        "ROLE2"
    ]
}
```

And the _userToRoleMapping_ file:

```json
{
    "$schema": "https://www.mashroom-server.com/schemas/mashroom-security-ldap-provider-user-to-role-mapping.json",
    "username": [
        "ROLE1",
        "ROLE2"
    ]
}
```
