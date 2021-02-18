
# Mashroom Error Pages

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

This plugin allows it to show proper HTML pages for arbitrary HTTP status codes.
It delivers error pages only if the request accept header contains text/html. So, typically not for AJAX requests.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-error-pages** as *dependency*.

You can override the default config in your Mashroom config file like this:

```json
{
  "plugins": {
        "Mashroom Error Pages Middleware": {
            "mapping": {
                "404": "./pages/404.html",
                "403": "./pages/403.html",
                "400": "http://my.server-com/bad_request.html",
                "500": "/some/server/path/500.html",
                "default": "./pages/default.html"
            }
        }
    }
}
```

 * _mapping_: Maps status codes to error pages. The target files can be file paths or HTTP/S urls.
   If the file path is not absolute the plugin will expect it to be relative to the plugin folder or the Mashroom server config file.
   If a status code is not defined in the mapping or no default exists, no error page will be shown.

### HTML Files

 * The HTML files should not reference _local_ resources (Images, CSS, JavaScript) because they cannot be loaded
 * They may contain the following placeholders:
     * _$REQUEST_URL_: The original request URL
     * _$STATUS_CODE_: The status code
     * _$MASHROOM_VERSION_: The _Mashroom Server_ version
     * _$MESSAGE\[messageKey(,Default text if i18n not yet available)\]_: A translated message from the _mashroom-i18n_ package
