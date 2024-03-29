
# Mashroom Helmet

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin adds the [Helmet](https://helmetjs.github.io/) middleware which sets a bunch of protective HTTP headers on each response.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-helmet** as *dependency*.

You can override the default config in your Mashroom config file like this:

```json
{
    "plugins": {
        "Mashroom Helmet Middleware": {
            "helmet": {
                "contentSecurityPolicy": false,
                "crossOriginEmbedderPolicy": false,
                "crossOriginOpenerPolicy": {
                    "policy": "same-origin"
                },
                "crossOriginResourcePolicy": {
                    "policy": "same-site"
                },
                "expectCt": false,
                "referrerPolicy": false,
                "hsts": {
                    "maxAge": 31536000
                },
                "noSniff": true,
                "originAgentCluster": false,
                "dnsPrefetchControl": {
                    "allow": false
                },
                "frameguard": {
                    "action": "sameorigin"
                },
                "permittedCrossDomainPolicies": {
                    "permittedPolicies": "none"
                },
                "hidePoweredBy": false,
                "xssFilter": true
            }
        }
    }
}
```

* _helmet_: The configuration will directly be passed to _Helmet_ middelware. Checkout the [Helmet Documentation](https://helmetjs.github.io/docs/)
for available options.

<span class="panel-info">
**NOTE**: You shouldn't enable the _noCache_ module because this would significantly decrease the performance of the _Mashroom Portal_.
</span>
