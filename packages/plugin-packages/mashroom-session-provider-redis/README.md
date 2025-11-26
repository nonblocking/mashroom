
# Mashroom Session Redis Provider

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin adds a Redis session store that can be used by [Mashroom Session](../mashroom-session).
Actually, this is just a wrapper for the [connect-redis](https://github.com/tj/connect-redis) package.

## Usage

If *node_modules/@mashroom* is configured as a plugin path, add **@mashroom/mashroom-session-provider-redis** as *dependency*.

Activate this session provider in your Mashroom Server config file like this:

```json
{
  "plugins": {
        "Mashroom Session Redis Provider": {
            "provider": "Mashroom Session MongoDB Provider"
        }
    }
}
```

And to change the default config of this plugin, add:

```json
{
  "plugins": {
      "Mashroom Session Redis Provider": {
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
          },
          "prefix": "mashroom:sess:"
          "ttl": 86400
      }
  }
}
```

 * *client*: Options for the Redis client. *redisOptions* are just to the *Redis* constructor of [ioredis](https://github.com/luin/ioredis
   Checkout out the [ioredis](https://github.com/luin/ioredis) documentation for all available options.
 * *prefix*: The key prefix. Appends to whatever prefix you may have set on the client itself. (Default: mashroom:sess:)
 * *ttl*: TTL in seconds (Default: 86400 - one day)

> [!NOTE]
> Don't set *client.redisOptions.keyPrefix* because otherwise the session metrics will not work properly.

### Usage with Sentinel

For a high-availability cluster with [Sentinel](https://redis.io/topics/sentinel) the configuration would look like this:

```json
{
  "plugins": {
      "Mashroom Session Redis Provider": {
         "client": {
             "redisOptions": {
                 "sentinels": [
                     { "host": "localhost", "port": 26379 },
                     { "host": "localhost", "port": 26380 }
                 ],
                 "name": "myMaster",
                 "keyPrefix": "mashroom:sess:"
             }
         }
      }
  }
}
```

 * *sentinels*: list of sentinel nodes to connect to
 * *name*: identifies a group of Redis instances composed of a master and one or more slaves

Check out the *Sentinel* section of the [ioredis](https://github.com/luin/ioredis) documentation for all available options.

### Usage with a cluster

For a [sharding cluster](https://redis.io/topics/cluster-spec) configure the plugin like this:

```json
{
  "plugins": {
      "Mashroom Session Redis Provider": {
         "client": {
             "cluster": true,
             "clusterNodes": [
                 {
                     "host": "redis-node1",
                     "port": "6379"
                 },
                 {
                     "host": "redis-node2",
                     "port": "6379"
                 }
             ],
             "clusterOptions": {
                 "maxRedirections": 3
             },
             "redisOptions": {
                 "keyPrefix": "mashroom:sess:"
             }
         }
      }
  }
}
```

 * *cluster*: Enables cluster support, must be true
 * *clusterNodes*: Cluster start nodes
 * *clusterOptions*: Passed as second argument of the *Redis.Cluster* constructor of *ioredis*
 * *redisOptions*: Passed as *redisOptions* in the *clusterOptions*

Check out the *Cluster* section of the [ioredis](https://github.com/luin/ioredis) documentation for all available options.
