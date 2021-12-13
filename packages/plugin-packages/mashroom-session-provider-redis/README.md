
# Mashroom Session Redis Provider

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin adds a Redis session store that can be used by _Mashroom Session_.
Actually this is just a wrapper for the [connect-redis](https://github.com/tj/connect-redis) package.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-session-provider-redis** as *dependency*.

Activate this session provider in your Mashroom config file like this:

```json
{
  "plugins": {
        "Mashroom Session Redis Provider": {
            "provider": "Mashroom Session MongoDB Provider"
        }
    }
}
```

And to change the default config of this plugin add:

```json
{
  "plugins": {
      "Mashroom Session Redis Provider": {
          "redisOptions": {
              "host": "localhost",
              "port": "6379",
              "keyPrefix": "mashroom:sess:"
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
      "Mashroom Session Redis Provider": {
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
```

* *sentinels*: list of sentinel nodes to connect to
* *name*: identifies a group of Redis instances composed of a master and one or more slaves

Checkout out the *Sentinel* section of the [ioredis](https://github.com/luin/ioredis) documentation for all available options.

### Usage with a cluster

For a [sharding cluster](https://redis.io/topics/cluster-spec) configure the plugin like this:

```json
{
  "plugins": {
      "Mashroom Session Redis Provider": {
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
```

* *cluster*: Enables cluster support, must be true
* *clusterNodes*: Cluster start nodes
* *clusterOptions*: Passed as second argument of the *Redis.Cluster* constructor of *ioredis*
* *redisOptions*: Passed as *redisOptions* in the *clusterOptions*

Checkout out the *Cluster* section of the [ioredis](https://github.com/luin/ioredis) documentation for all available options.
