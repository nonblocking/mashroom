
### Mashroom Messaging External Provider MQTT

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

This plugin allows to use a MQTT server as external messaging provider for _Mashroom_ server side messaging.
This enables cluster support and also allows communication with 3rd party systems.

#### Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-messaging-external-provider-mqtt** as *dependency*.

To activate this provider configure the _Mashroom Messaging_ plugin like this:

```json
{
    "plugins": {
        "Mashroom Messaging Services": {
            "externalProvider": "Mashroom Messaging External Provider MQTT"
        }
    }
}
```

And configure this plugin like this in the Mashroom config file:

```json
{
  "plugins": {
        "Mashroom Messaging External Provider MQTT": {
            "internalTopic": "mashroom",
            "mqttConnectUrl": "mqtt://localhost:1883",
            "mqttProtocolVersion": 4,
            "mqttQoS": 1,
            "mqttUser": null,
            "mqttPassword": null,
            "rejectUnauthorized": true
        }
    }
}
```

 * _internalTopic_: The base topic the server should use for internal messages. E.g. if the value is *mashroom/test*
    all messages published internally are prefixed with *mashroom/test* before published to MQTT and at the same time
    this provider listens to *mashroom/test/#* for messages (Default: mashroom)
 * _mqttConnectUrl_: MQTT connect URL (Default: mqtt://localhost:1883)
 * _mqttProtocolVersion_: MQTT protocol version (Default: 4)
 * _mqttQoS_: Quality of service level (0, 1, or 2) (Default: 1)
 * _mqttUser_: Optional MQTT username (Default: null)
 * _mqttPassword_: Optional MQTT password (Default: null)
 * _rejectUnauthorized_: If you use mqtts or wss if a self signed certificate set it to false (Default: true)
