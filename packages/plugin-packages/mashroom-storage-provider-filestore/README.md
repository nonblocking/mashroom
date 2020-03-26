
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
            "dataFolder": "/var/mashroom/data/storage"
        }
    }
}
```

 * _dataFolder_: Base folder for JSON files (Default: ./data/storage)

