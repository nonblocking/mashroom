
# Mashroom Basic Authentication Wrapper Security Provider

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

This plugin adds support for Basic authentication to any other security provider that implements _login()_ properly.
This can be useful when you need to access some APIs on the server from an external system or for test purposes.

**Only use Basic over HTTPS in production!**

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-security-provider-basic-wrapper** as *dependency*.

To activate this provider configure the _Mashroom Security_ plugin like this:

```json
{
    "plugins": {
        "Mashroom Security Services": {
            "provider": "Mashroom Basic Wrapper Security Provider"
        }
    }
}
```

And configure this plugin like this in the Mashroom config file:

```json
{
  "plugins": {
        "Mashroom Basic Wrapper Security Provider": {
             "targetSecurityProvider": "Mashroom Security Simple Provider",
             "onlyPreemptive": true,
             "realm": "mashroom"
        }
    }
}
```

 * _targetSecurityProvider_: The actual security provider that is used to login (Default: Mashroom Security Simple Provider)
 * _onlyPreemptive_: Only use BASIC if it is sent preemptively if true. Otherwise, the plugin will send HTTP 401 and *WWW-Authenticate*
   which will trigger the Browser's login popup (Default: true)
 * _realm_: The realm name that should be used if _onlyPreemptive_ is false (Default: mashroom)

