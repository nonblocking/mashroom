
### Mashroom Session Filestore Provider

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**. 

This plugin adds a file based session store that can be used by _Mashroom Session_.
Actually this is just a wrapper for the [session-file-store](https://github.com/valery-barysok/session-file-store) package.

#### Usage

If _node_modules/@mashroom_ is configured as plugin path just add this package as _dependency_.

You can override the default config in your Mashroom config file like this:

```json
{
  "plugins": {
        "Mashroom Session Filestore Provider": {
            "path": "../../data/sessions",
            "ttl": 1200
        }
    }
}
```

All config options are passed to the _session-file-store_. See [session-file-store](https://github.com/valery-barysok/session-file-store) for available options.

