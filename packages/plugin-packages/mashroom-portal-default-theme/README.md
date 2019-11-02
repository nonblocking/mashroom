
### Mashroom Portal Default Theme

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**. 

Adds adds the default theme to the _Mashroom Portal_.

#### Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-portal-default-theme** as *dependency*.

You can override the default config in your Mashroom config file like this:

```json
{
    "plugins": {
        "Mashroom Portal Default Theme": {
            "showEnvAndVersions": true
        }
    }
}
```
 * _showEnvAndVersions_: Show the environment (_NODE_ENV_) and version information in the header (Default: false)

