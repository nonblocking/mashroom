
# Mashroom Session Filestore Provider

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin adds a file-based session store that can be used by [Mashroom Session](../mashroom-session).
Actually, this is just a wrapper for the [session-file-store](https://github.com/valery-barysok/session-file-store) package.

## Usage

If *node_modules/@mashroom* is configured as a plugin path, add **@mashroom/mashroom-session-provider-filestore** as *dependency*.

Activate this session provider in your Mashroom Server config file like this:

```json
{
  "plugins": {
        "Mashroom Session Middleware": {
            "provider": "Mashroom Session Filestore Provider"
        }
    }
}
```

And to change the default config of this plugin, add:

```json
{
  "plugins": {
        "Mashroom Session Filestore Provider": {
            "path": "../../data/sessions"
        }
    }
}
```

> [!NOTE]
> The base for relative paths is the Mashroom Server config file.

All config options are passed to the _session-file-store_. See [session-file-store](https://github.com/valery-barysok/session-file-store) for available options.

