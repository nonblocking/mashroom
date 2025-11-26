
# Mashroom Storage Filestore Provider

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin adds a simple but cluster-safe, JSON-based provider for [Mashroom Storage](../mashroom-storage).

## Usage

If *node_modules/@mashroom* is configured as a plugin path, add **@mashroom/mashroom-storage-provider-filestore** as *dependency*.

To activate this provider configure the [Mashroom Storage](../mashroom-storage) plugin like this:

```json
{
    "plugins": {
         "Mashroom Storage Services": {
              "provider": "Mashroom Storage Filestore Provider"
          }
    }
}
```

And configure this plugin like this in the server config file:

```json
{
  "plugins": {
        "Mashroom Storage Filestore Provider": {
            "dataFolder": "/var/mashroom/data/storage",
            "checkExternalChangePeriodMs": 100,
            "prettyPrintJson": true
        }
    }
}
```

 * _dataFolder_: The **shared folder** to store the data files. The base for relative paths is the server config file (Default: ./data/storage)
 * _checkExternalChangePeriodMs_: Poll interval for external file changes (by other servers in the cluster).
   You can increase the default if you run a single server, the config is readonly or performance is more important than consistency (Default: 100)
 * _prettyPrintJson_: Pretty print the JSON files to make it human-readable (Default: true)
