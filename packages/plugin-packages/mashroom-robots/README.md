
# Mashroom Robots

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin adds a middleware that exposes a robots.txt file for search engines.

## Usage

If *node_modules/@mashroom* is configured as a plugin path, add **@mashroom/mashroom-robots** as *dependency*.

You can override the default config in your server config file like this:

```json
{
    "plugins": {
        "Mashroom Robots Middleware": {
            "robots.txt": "./robots.txt"
        }
    }
}
```

* _robots.txt_: The path to the robots.txt file. Can be relative to the server config file or absolute.
  If not provided, the default config denies the access to all search engines.
