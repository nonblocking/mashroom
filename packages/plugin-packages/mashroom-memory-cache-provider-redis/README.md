
# Mashroom Memory Cache Redis Provider

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

This plugin adds *Redis* based provider for the *mashroom-memory-cache*.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-memory-cache-provider-redis** as *dependency*.

To activate this provider configure the _Mashroom Memory Cache_ plugin like this:

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

And configure this plugin like this in the Mashroom config file:

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

Checkout out the [ioredis](https://github.com/luin/ioredis) documentation for all available options.

### Usage with Sentinel

For a high availability cluster with [Sentinel](https://redis.io/topics/sentinel) the configuration would look like this:

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

* *sentinels*: list of sentinel nodes to connect to
* *name*: identifies a group of Redis instances composed of a master and one or more slaves

Checkout out the *Sentinel* section of the [ioredis](https://github.com/luin/ioredis) documentation for all available options.

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
* *clusterOptions*: Passed as second argument of the *Redis.Cluster* constructor of *ioredis*
* *redisOptions*: Passed as *redisOptions* in the *clusterOptions*

Checkout out the *Cluster* section of the [ioredis](https://github.com/luin/ioredis) documentation for all available options.

