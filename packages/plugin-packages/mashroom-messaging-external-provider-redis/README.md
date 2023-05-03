
# Mashroom Messaging External Provider Redis

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin allows to use a Redis server as external messaging provider for server side messaging.
This enables cluster support for server side messaging and also allows communication with 3rd party systems.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-messaging-external-provider-redis** as *dependency*.

To activate this provider configure the _Mashroom Messaging_ plugin like this:

```json
{
    "plugins": {
        "Mashroom Messaging Services": {
            "externalProvider": "Mashroom Messaging External Provider Redis"
        }
    }
}
```


And configure this plugin like this in the Mashroom config file:

```json
{
  "plugins": {
        "Mashroom Messaging External Provider Redjs": {
            "internalTopic": "mashroom",
            "client": {
                "redisOptions": {
                    "host": "localhost",
                    "port": "6379",
                    "maxRetriesPerRequest": 3,
                    "enableOfflineQueue": false
                },
                "cluster": false,
                "clusterNodes": null,
                "clusterOptions": null
            }
        }
    }
}
```

 * _internalTopic_: The base topic the server should use for internal messages. E.g. if the value is *mashroom/test*
   all messages published internally are prefixed with *mashroom/test* before published to MQTT and at the same time
   this provider listens to *mashroom/test/#* for messages (Default: mashroom)
 * _client_: Options for the Redis client. *redisOptions* are just to the *Redis* constructor of [ioredis](https://github.com/luin/ioredis
   Checkout out the [ioredis](https://github.com/luin/ioredis) documentation for all available options.
