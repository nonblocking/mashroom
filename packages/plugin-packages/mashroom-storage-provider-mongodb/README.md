
# Mashroom Storage MongoDB Provider

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin adds a [MongoDB](https://www.mongodb.com/) based provider for [Mashroom Storage](../mashroom-storage).

## Usage

If *node_modules/@mashroom* is configured as a plugin path, add **@mashroom/mashroom-storage-provider-mongodb** as *dependency*.

To activate this provider, configure the [Mashroom Storage](../mashroom-storage) plugin like this:

```json
{
    "plugins": {
         "Mashroom Storage Services": {
              "provider": "Mashroom Storage MongoDB Provider"
          }
    }
}
```

And configure this plugin like this in the server config file:

```json
{
  "plugins": {
        "Mashroom Storage MongoDB Provider": {
            "uri": "mongodb://user:xxxxx@localhost:27017/mashroom_storage_db",
            "connectionOptions": {
                "poolSize": 5,
                "useUnifiedTopology": true,
                "useNewUrlParser": true
            }
        }
    }
}
```

 * _uri_: A MongoDB connection string (see [MongoDB documentation](https://docs.mongodb.com/manual/reference/connection-string)).
   **Must** contain the database to use.
 * _connectionOptions_: The MongoDB connection options (see [MongoDB documentation](https://mongodb.github.io/node-mongodb-native/2.2/reference/connecting/connection-settings)).
