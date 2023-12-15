
# Mashroom Storage Filestore Provider

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

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
            "checkExternalChangePeriodMs": -1,
            "prettyPrintJson": true
        }
    }
}
```

 * _dataFolder_: The **shared folder** to store the data files. The base for relative paths is the Mashroom config file (Default: ./data/storage)
 * _checkExternalChangePeriodMs_: Check JSON files for external changes after this period.
   Only set a value > 0 if you either run a single server, the config is readonly or performance is more important
   than consistency (Default: -1)
 * _prettyPrintJson_: Pretty print the JSON files to make it human-readable (Default: true)
