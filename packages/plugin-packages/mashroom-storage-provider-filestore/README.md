
# Mashroom Storage Filestore Provider

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

This plugin adds a simple but cluster-safe, JSON based storage provider.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-storage-provider-filestore** as *dependency*.

To activate this provider configure the _Mashroom Security_ plugin like this:

```json
{
    "plugins": {
         "Mashroom Storage Services": {
              "provider": "Mashroom Storage Filestore Provider"
          }
    }
}
```

And configure this plugin like this in the Mashroom config file:

```json
{
  "plugins": {
        "Mashroom Storage Filestore Provider": {
            "dataFolder": "/var/mashroom/data/storage",
            "checkExternalChangePeriodMs": 2000,
            "prettyPrintJson": true
        }
    }
}
```

 * _dataFolder_: Base folder for JSON files (Default: ./data/storage)
 * _checkExternalChangePeriodMs_: Check JSON files for external changes after this period.
   If you set this to a value <= 0 the file timestamp will be checked on every access which will cause
   a lot of extra I/O and should only be done if the *mashroom-memory-cache plugin* is present (default: 2000)
 * _prettyPrintJson_: Pretty print the JSON files to make it human readable (default: true)
