
# Mashroom Portal Default Theme

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugins adds the default theme for the _Mashroom Portal_.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-portal-default-theme** as *dependency*.

You can override the default config in your Mashroom config file like this:

```json
{
    "plugins": {
        "Mashroom Portal Default Theme": {
            "spaMode": true,
            "showPortalAppHeaders": true,
            "showEnvAndVersions": true
        }
    }
}
```

 * _spaMode_: The theme will try to operate like an SPA and loads new page content via AJAX and replaces the DOM.
   This only works until the user does not navigate on a page with a different theme or different page enhancements,
   in that case a full page load is triggered (Default: true)
 * _showPortalAppHeaders_: Show or hide Portal App headers (Default: true)
 * _showEnvAndVersions_: Show the environment (_NODE_ENV_) and version information in the header (Default: false)

