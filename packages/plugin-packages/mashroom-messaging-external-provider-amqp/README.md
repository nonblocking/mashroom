
# Mashroom Messaging External Provider AMQP

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

This plugin allows to use a AMQP 1.0 compliant broker as external messaging provider for _Mashroom_ server side messaging.
This enables cluster support for server side messaging and also allows communication with 3rd party systems.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-messaging-external-provider-amqp** as *dependency*.

To activate this provider configure the _Mashroom Messaging_ plugin like this:

```json
{
    "plugins": {
        "Mashroom Messaging Services": {
            "externalProvider": "Mashroom Messaging External Provider AMQP"
        }
    }
}
```

And configure this plugin like this in the Mashroom config file:

```json
{
  "plugins": {
        "Mashroom Messaging External Provider MQTT": {
              "internalRoutingKey": "mashroom",
              "brokerTopicExchangePrefix": "/topic/",
              "brokerTopicMatchAny": "#",
              "brokerHost": "localhost",
              "brokerPort": 5672,
              "brokerUsername": null,
              "brokerPassword": null
        }
    }
}
```

 * _internalRoutingKey_: The base routing key the server should use for internal messages. E.g. if the value is *mashroom.test*
    all messages published internally are prefixed with *mashroom.test* before published to the broker and at the same time
    this provider listens to *mashroom.test.#* for messages (Default: mashroom)
 * _brokerTopicExchangePrefix_: The prefix for the topic exchange (default: /topic/ (RabbitMQ))
 * _brokerTopicMatchAny_: The wildcard for match any words (default: # (RabbitMQ))
 * _brokerHost_: AMQP broker host (Default: localhost)
 * _brokerPort_: AMQP broker port (Default: 5672)
 * _brokerUsername_: AMQP broker username (optional)
 * _brokerPassword_: AMQP broker password (optional)

### Broker specific configuration

*RabbitMQ*

     "brokerTopicExchangePrefix": "/topic/",
     "brokerTopicMatchAny": "#",

*ActiveMQ*

     "brokerTopicExchangePrefix": "topic://",
     "brokerTopicMatchAny": ">",

*Qpid Broker*

     "brokerTopicExchangePrefix": "amq.topic/",
     "brokerTopicMatchAny": "#",

