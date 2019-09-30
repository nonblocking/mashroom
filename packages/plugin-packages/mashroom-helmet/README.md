
### Mashroom Helmet

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**. 

This plugin adds the [Helmet](https://helmetjs.github.io/) middleware which sets a bunch of protective HTTP headers
on each response.

#### Usage

If *node_modules/@mashroom* is configured as plugin path just add this package as _dependency_.

You can override the default config in your Mashroom config file like this:

```json
{
    "plugins": {
        "Mashroom Helmet Middleware": {
            "helmet": {
                "contentSecurityPolicy": false,
                "dnsPrefetchControl ": {
                    "allow": false
                },
                "expectCt": false,
                "featurePolicy": false,
                "frameguard": {
                    "action": "deny"
                },
                "hidePoweredBy": false,
                "hsts": {
                    "maxAge": 31536000
                },
                "ieNoOpen": false,
                "noSniff": {},
                "permittedCrossDomainPolicies": false,
                "referrerPolicy": false,
                "xssFilter": {
                    "mode": null
                }
            }
        }
    }
}
```

* _helmet_: The configuration will directly be passed to _Helmet_ middelware. Checkout the [Helmet Documentation](https://helmetjs.github.io/docs/) 
for available options. You should enable the _noCache_ module because this would significantly decrease the performance
of the _Mashroom Portal_.
