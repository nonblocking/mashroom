
# Mashroom Session MongoDB Provider

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin adds a mongoDB session store that can be used by [Mashroom Session](../mashroom-session).
Actually, this is just a wrapper for the [connect-mongo](https://github.com/jdesboeufs/connect-mongo) package.

## Usage

If *node_modules/@mashroom* is configured as a plugin path, add **@mashroom/mashroom-session-provider-mongodb** as *dependency*.

Activate this session provider in your Mashroom Server config file like this:

```json
{
  "plugins": {
        "Mashroom Session Middleware": {
            "provider": "Mashroom Session MongoDB Provider"
        }
    }
}
```

And to change the default config of this plugin, add:

```json
{
  "plugins": {
      "Mashroom Session MongoDB Provider": {
          "client": {
              "uri": "mongodb://localhost:27017/mashroom_session_db?connectTimeoutMS=1000&socketTimeoutMS=2500",
              "connectionOptions": {
                  "minPoolSize": 5,
                  "serverSelectionTimeoutMS": 3000
              }
          },
          "collectionName": "mashroom-sessions",
          "ttl": 86400,
          "autoRemove": "native",
          "autoRemoveInterval": 10,
          "touchAfter": 0,
          "crypto": {
              "secret": false
          }
      }
    }
}
```

 * *client*: Options to construct the client. *connectionOptions* are passed to the [mongodb driver](https://github.com/mongodb/node-mongodb-native).
 * *collectionName*: Mongo collection to store sessions (Default: mashroom-sessions)
 * *ttl*: TTL in seconds (Default: 86400 - one day)
 * *autoRemove*: Session remove strategy (Default: native)
 * *autoRemoveInterval*: Remove interval in seconds if *autoRemove* is interval (Default: 10)
 * *touchAfter*: Interval in seconds between session updates (Default: 0)
 * *crypto*: Options regarding session encryption. For details see [connect-mongo](https://github.com/jdesboeufs/connect-mongo).
