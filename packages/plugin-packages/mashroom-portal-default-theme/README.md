
### Mashroom Portal Default Theme

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**. 

Adds adds the default theme to the _Mashroom Portal_.

#### Usage

If _node_modules/@mashroom_ is configured as plugin path just add this package as _dependency_.

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

