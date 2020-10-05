
# Mashroom Session Filestore Provider

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

This plugin adds a file based session store that can be used by _Mashroom Session_.
Actually this is just a wrapper for the [session-file-store](https://github.com/valery-barysok/session-file-store) package.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-session-provider-filestore** as *dependency*.

Activate this session provider in your Mashroom config file like this:

```json
{
  "plugins": {
        "Mashroom Session Middleware": {
            "provider": "Mashroom Session Filestore Provider"
        }
    }
}
```

And to change the default config of this plugin add:

```json
{
  "plugins": {
        "Mashroom Session Filestore Provider": {
            "path": "../../data/sessions"
        }
    }
}
```

Please Note: The base for relative paths is the Mashroom config file.

All config options are passed to the _session-file-store_. See [session-file-store](https://github.com/valery-barysok/session-file-store) for available options.

