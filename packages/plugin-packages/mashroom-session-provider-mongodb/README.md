
# Mashroom Session MongoDB Provider

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

This plugin adds a mongoDB session store that can be used by _Mashroom Session_.
Actually this is just a wrapper for the [connect-mongodb-session](https://github.com/mongodb-js/connect-mongodb-session) package.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-session-provider-mongodb** as *dependency*.

Activate this session provider in your Mashroom config file like this:

```json
{
  "plugins": {
        "Mashroom Session Middleware": {
            "provider": "Mashroom Session MongoDB Provider"
        }
    }
}
```

And to change the default config of this plugin add:

```json
{
  "plugins": {
      "Mashroom Session MongoDB Provider": {
          "uri": "mongodb://username:password@localhost:27017/mashroom_session_db?connectTimeoutMS=1000&socketTimeoutMS=2500",
          "collection": "sessions",
          "connectionOptions": {
              "poolSize": 5,
              "useUnifiedTopology": true,
              "useNewUrlParser": true
          }
      }
    }
}
```

All config options are passed to the _connect-mongodb-session_.
See [connect-mongodb-session](https://github.com/mongodb-js/connect-mongodb-session) for available options.

