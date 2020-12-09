
# Mashroom Error Pages

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

This plugin allows it to show proper HTML pages for arbitrary HTTP status codes.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-error-pages** as *dependency*.

You can override the default config in your Mashroom config file like this:

```json
{
  "plugins": {
        "Mashroom Error Pages Middleware": {
            "mapping": {
                "404": {
                    "de": "./pages/404_de.html",
                    "default": "./pages/404.html"
                },
                "403": {
                    "de": "./pages/403_de.html",
                    "default": "./pages/403.html"
                },
                "400": "./pages/bad_request.html",
                "500": {
                    "fr": "http://www.foo.bar/500.html",
                    "default": "/some/server/path/500.html"
                },
                "default": {
                    "de": "./pages/default_de.html",
                    "default": "./pages/default.html"
                }
            }
        }
    }
}
```

 * _mapping_: Maps status codes to error pages. If the value is an object it may contain multiple entries for different languages
   and optionally a _default_ if the language doesn't match. If it is a string the file will always be used for this status code.
   If a code is not defined in the mapping or no default exists no error page is generated.
   The target files can be file paths or HTTP/S urls. If the file path is not absolute the plugin will expect it to be
   relative to the plugin folder or the Mashroom server config file.

**Please Note**: The HTML files should not reference _local_ resources (Images, CSS, JavaScript) because they cannot be loaded

