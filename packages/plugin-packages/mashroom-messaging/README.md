
# Mashroom Messaging

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

This plugin adds server side messaging support to _Mashroom Server_.
If an external provider plugin (e.g. MQTT) is configured the messages can also be sent across multiple nodes (cluster support!)
and to 3rd party systems.

Optionally it supports sending and receiving messages via WebSocket (Requires _mashroom-websocket_).

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-messaging** as *dependency*.

And you can use the messaging service like this:

```ts
import type {MashroomMessagingService} from '@mashroom/mashroom-messaging/type-definitions';

export default async (req: Request, res: Response) => {
    const messagingService: MashroomMessagingService = req.pluginContext.services.messaging.service;

    // Subscribe
    await messagingService.subscribe(req, 'my/topic', (data) => {
        // Do something with data
    });

    // Publish
    await messagingService.publish(req, 'other/topic', {
        item: 'Beer',
        quantity: 1,
    });

    // ...
}
```

You can override the default config in your Mashroom config file like this:

```json
{
  "plugins": {
        "Mashroom Messaging Services": {
            "externalProvider": null,
            "externalTopics": [],
            "userPrivateBaseTopic": "user",
            "enableWebSockets": true,
            "topicACL": "./topic_acl.json"
        }
    }
}
```

 * _externalProvider_: A plugin that connects to an external messaging system. Allows to receive messages from other systems
    and to send messages "out" (Default: null)
 * _externalTopics_: A list of topic roots that should be considered as external. E.g. if the list contains _other-system_
    topics published to _other-system/foo_ or _other-system/bar_ would be send via _externalProvider_. (Default: [])
 * _userPrivateBaseTopic_: The base for private user topics. If the prefix is _something/user_ the user _john_ would only be able
    to subscribe to _user/john/something_ and not to _something/user/thomas/weather-update_ (Default: user).
 * _enableWebSockets_: Enable WebSocket support when _mashroom-websocket_ is present (Default: true)
 * _topicACL_: Access control list to restrict the use of certain topic patterns to specific roles

With a config like that you can place a file _topic_acl.json_ in your server config  with a content like this:

```json
{
    "my/topic": {
        "allow": ["Role1"]
    },
    "foo/bar/#": {
        "allow": "any"
        "deny": ["NotSoTrustedRole"]
    }
}
```

The general structure is:

```
    "/my/+/topic/#": {
        "allow": "any"|<array of roles>
        "deny": "any"|<array of roles>
    }
```

You can use here _+_ or _*_ as a wildcard for a single level and _#_ for multiple levels.

### WebSocket interface

If _enableWebSockets_ is true you can connect to the messaging system on _<websocket_base_path>/messaging_ which is by default
**/websocket/messaging**. The server expects and sends serialized JSON.

After a successful connection you can use the following commands:

**Subscribe**

```
{
  messageId: 'ABCD',
  command: 'subscribe',
  topic: 'foo/bar',
}
```
The messageId should be unique. You will get a response message like this when the operation succeeds:

```
{
  messageId: 'ABCD',
  success: true,
}
```

Otherwise a error message like this:

```
{
  messageId: 'ABCD',
  error: true,
  message: 'The error message'
}
```

**Unsubscribe**

```
{
  messageId: 'ABCD',
  command: 'unsubscribe',
  topic: 'foo/bar',
}
```

Success and error response messages are the same as above.

**Publish**

```
{
  messageId: 'ABCD',
  command: 'publish',
  topic: 'foo/bar',
  message: {
     foo: 'bar'
  }
}
```

Success and error response messages are the same as above.

And the server will push the following **if a message for a subscribed topic arrives**:

```
{
  remoteMessage: true,
  topic: 'foo/bar',
  message: {
     what: 'ever'
  }
}
```

## Services

### MashroomMessagingService

The exposed service is accessible through _pluginContext.services.messaging.service_

**Interface:**

```ts
export interface MashroomMessagingService {
    /**
     * Subscribe to given topic.
     * Topics can be hierarchical and also can contain wildcards. Supported wildcards are + for a single level
     * and # for multiple levels. E.g. foo/+/bar or foo/#
     *
     * Throws an exception if there is no authenticated user
     */
    subscribe(
        req: Request,
        topic: string,
        callback: MashroomMessagingSubscriberCallback,
    ): Promise<void>;

    /**
     * Unsubscribe from topic
     */
    unsubscribe(
        topic: string,
        callback: MashroomMessagingSubscriberCallback,
    ): Promise<void>;

    /**
     * Publish to a specific topic
     *
     * Throws an exception if there is no authenticated user
     */
    publish(req: Request, topic: string, data: any): Promise<void>;

    /**
     * The private topic only the current user can access.
     * E.g. if the value is user/john the user john can access to user/john/whatever
     * but not to user/otheruser/foo
     *
     * Throws an exception if there is no authenticated user
     */
    getUserPrivateTopic(req: Request): string;

    /**
     * The connect path to send publish or subscribe via WebSocket.
     * Only available if enableWebSockets is true and mashroom-websocket is preset.
     */
    getWebSocketConnectPath(req: Request): string | null | undefined;
}
```

## Plugin Types

### external-messaging-provider

This plugin type connects the messaging system to an external provider such as MQTT or AMQP.
It also adds cluster support to the messaging system.

To register your custom external-messaging-provider plugin add this to _package.json_:

```json
{
    "mashroom": {
        "plugins": [
            {
                "name": "My Custom External Messaging Provider",
                "type": "external-messaging-provider",
                "bootstrap": "./dist/mashroom-bootstrap",
                "defaultConfig": {
                   "myProperty": "foo"
                }
            }
        ]
    }
}
```

The bootstrap returns the provider:

```ts
import type {MashroomExternalMessagingProviderPluginBootstrapFunction} from '@mashroom/mashroom-messaging/type-definitions';

const bootstrap: MashroomExternalMessagingProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {

    return new MyExternalMessagingProvider(/* ... */);
};

export default bootstrap;
```

The provider has to implement the following interface:

```ts
export interface MashroomMessagingExternalProvider {
    /**
     * Add a message listener
     * The message must be a JSON object.
     */
    addMessageListener(listener: MashroomExternalMessageListener): void;

    /**
     * Remove an existing listener
     */
    removeMessageListener(listener: MashroomExternalMessageListener): void;

    /**
     * Send a message to given external topic.
     * The passed topic must be prefixed with the topic the provider is listening to.
     * E.g. if the passed topic is foo/bar and the provider is listening to mashroom/# the message must be
     * sent to mashroom/foo/bars.
     *
     * The message will be a JSON object.
     */
    sendInternalMessage(topic: string, message: any): Promise<void>;

    /**
     * Send a message to given external topic.
     * The message will be a JSON object.
     */
    sendExternalMessage(topic: string, message: any): Promise<void>;
}
```
