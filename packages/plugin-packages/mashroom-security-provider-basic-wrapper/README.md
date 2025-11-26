
# Mashroom Basic Authentication Wrapper Security Provider

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin adds support for Basic authentication to any other security provider that implements _login()_ properly.
This can be useful when you need to access some APIs on the server from an external system or for test purposes.

## Usage

If *node_modules/@mashroom* is configured as a plugin path, add **@mashroom/mashroom-security-provider-basic-wrapper** as *dependency*.

To activate this provider configure the [Mashroom Security](../mashroom-security) plugin like this:

```json
{
    "plugins": {
        "Mashroom Security Services": {
            "provider": "Mashroom Basic Wrapper Security Provider"
        }
    }
}
```

And configure this plugin like this in the server config file:

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

 * _targetSecurityProvider_: The actual security provider used to log in (Default: Mashroom Security Simple Provider)
 * _onlyPreemptive_: Only use BASIC if it is sent preemptively if true. Otherwise, the plugin will send HTTP 401 and *WWW-Authenticate*
   which will trigger the Browser's login popup (Default: true)
 * _realm_: The realm name that should be used if _onlyPreemptive_ is false (Default: mashroom)

