
# Mashroom Memory Cache Redis Provider

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin adds a *Redis* based provider for the [mashroom-memory-cache](../mashroom-memory-cache).

## Usage

If *node_modules/@mashroom* is configured as a plugin path, add **@mashroom/mashroom-memory-cache-provider-redis** as *dependency*.

To activate this provider configure the [mashroom-memory-cache](../mashroom-memory-cache) plugin like this:

```json
{
    "plugins": {
          "Mashroom Memory Cache Redis Provider": {
              "provider": "Mashroom Memory Cache Redis Provider",
              "defaultTTLSec": 10
          }
    }
}
```

And configure this plugin like this in the server config file:

```json
{
  "plugins": {
        "Mashroom Memory Cache Redis Provider": {
            "redisOptions": {
                "host": "localhost",
                "port": "6379",
                "keyPrefix": "mashroom:cache:"
           }
        }
    }
}
```

* *redisOptions*: Passed to the *Redis* constructor of [ioredis](https://github.com/luin/ioredis)

Check out the [ioredis](https://github.com/luin/ioredis) documentation for all available options.

### Usage with Sentinel

For a high-availability cluster with [Sentinel](https://redis.io/topics/sentinel) the configuration would look like this:

```json
{
  "plugins": {
      "Mashroom Memory Cache Redis Provider": {
          "redisOptions": {
              "sentinels": [
                  { "host": "localhost", "port": 26379 },
                  { "host": "localhost", "port": 26380 }
               ],
              "name": "myMaster",
              "keyPrefix": "mashroom:cache:"
          }
      }
  }
}
```

* *sentinels*: List of sentinel nodes to connect to
* *name*: Identifies a group of Redis instances composed of a master and one or more slaves

Check out the *Sentinel* section of the [ioredis](https://github.com/luin/ioredis) documentation for all available options.

### Usage with a cluster

For a [sharding cluster](https://redis.io/topics/cluster-spec) configure the plugin like this:

```json
{
  "plugins": {
      "Mashroom Memory Cache Redis Provider": {
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
              "keyPrefix": "mashroom:cache:"
          }
      }
  }
}
```

* *cluster*: Enables cluster support, must be true
* *clusterNodes*: Cluster start nodes
* *clusterOptions*: Passed as the second argument of the *Redis.Cluster* constructor of *ioredis*
* *redisOptions*: Passed as *redisOptions* in the *clusterOptions*

Check out the *Cluster* section of the [ioredis](https://github.com/luin/ioredis) documentation for all available options.
