
# Mashroom Storage MongoDB Provider

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

This plugin adds a [MongoDB](https://www.mongodb.com/) based storage provider.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-storage-provider-mongodb** as *dependency*.

To activate this provider configure the _Mashroom Security_ plugin like this:

```json
{
    "plugins": {
         "Mashroom Storage Services": {
              "provider": "Mashroom Storage MongoDB Provider"
          }
    }
}
```

And configure this plugin like this in the Mashroom config file:

```json
{
  "plugins": {
        "Mashroom Storage MongoDB Provider": {
            "connectionUri": "mongodb://user:xxxxx@localhost:27017/mashroom_storage_db"
        }
    }
}
```

 * _connectionUri_: A MongoDB connection string (see [MongoDB documentation](https://docs.mongodb.com/manual/reference/connection-string)).
   **Must** contain the database to use.

