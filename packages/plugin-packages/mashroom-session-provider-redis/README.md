
### Mashroom Session Redis Provider

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**. 

This plugin adds a Redis session store that can be used by _Mashroom Session_.
Actually this is just a wrapper for the [connect-redis](https://github.com/tj/connect-redis) package.

#### Usage

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
              "keyPrefix": "mashroom:"
          } 
      }
  }
}
```

Or for a Redis Cluster:

```json
{
  "plugins": {
      "Mashroom Session Redis Provider": {
          "redisOptions": {
              "keyPrefix": "mashroom:"
          },
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
          }
      }
  }
}
```

* *redisOptions*: Passed to the *Redis* constructor of *ioredis*
* *cluster*: Enables cluster support
* *clusterNodes*: Cluster start nodes
* *clusterOptions*: Passed as second argument of the *Redis.Cluster* constructor of *ioredis*

Checkout out the [ioredis](https://github.com/luin/ioredis) documentation for all available options.
