
# Mashroom HTTP proxy

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin adds a service for forwarding requests to a target URI. It supports HTTP, HTTPS and WebSockets (only the default/nodeHttpProxy implementation, see below).

## Usage

If *node_modules/@mashroom* is configured as a plugin path, add **@mashroom/mashroom-http-proxy** as *dependency*.

After that you can use the service like this:

```ts
import type {MashroomHttpProxyService} from '@mashroom/mashroom-http-proxy/type-definitions';

export default async (req: Request, res: Response) => {
    const httpProxyService: MashroomHttpProxyService = req.pluginContext.services.proxy.service;

    const targetURI = 'http://foo.bar/api/test';
    const additionalHeaders = {};
    await httpProxyService.forward(req, res, targetURI, additionalHeaders);
}
```

You can override the default config in your server config file like this:

```json
{
    "plugins": {
        "Mashroom Http Proxy Services": {
            "forwardMethods": [
                "GET",
                "POST",
                "PUT",
                "DELETE"
            ],
            "forwardHeaders": [
              "accept",
              "accept-*",
              "range",
              "expires",
              "cache-control",
              "last-modified",
              "content-*",
              "x-forwarded-*",
              "uber-trace-id",
              "uberctx-",
              "b3",
              "x-b3-*",
              "trace*",
              "sec-websocket-*"
            ],
            "rejectUnauthorized": true,
            "poolMaxTotalSockets": null,
            "poolMaxSocketsPerHost": 10,
            "poolMaxWaitingRequestsPerHost": null,
            "socketTimeoutMs": 30000,
            "keepAlive": true,
            "retryOnReset": true,
            "wsMaxConnectionsTotal": 2000,
            "wsMaxConnectionsPerHost": null,
            "proxyImpl": "default"
        }
    }
}
```
 * _forwardMethods_: The HTTP methods that should be forwarded
 * _forwardHeaders_: The HTTP headers that should be forwarded. May contain a _*_ as wildcard.
 * _rejectUnauthorized_: Reject self-signed certificates (Default: true)
 * _poolMaxTotalSockets_: Max HTTP pool sockets total (Default: null - no limit)
 * _poolMaxSocketsPerHost_: Max HTTP pool sockets per target host (Default: 10)
 * _poolMaxWaitingRequestsPerHost_: Max waiting HTTP requests per target host, needs to be > 0 if set (Default: null - no limit)
 * _socketTimeoutMs_: HTTP socket timeout, which is the time the target has to accept the connection and start sending the response (Default: 30000)
 * _keepAlive_: HTTP connection keep-alive. Set this to *false* if you experience random ECONNRESET with the *nodeHttpProxy* implementation,
    see: [https://github.com/nonblocking/mashroom/issues/77](https://github.com/nonblocking/mashroom/issues/77) (Default: true)
 * _retryOnReset_: If the target resets the HTTP connection (because a keep-alive connection is broken) retry once (Default: true)
 * _wsMaxConnectionsTotal_: Max WebSocket connections total. Set this to 0 if you want to disable the WS proxy (Default: 2000)
 * _wsMaxConnectionsPerHost_: Max WebSocket connections per target host (Default: 0 - no limit)
 * _createForwardedForHeaders_: Add *x-forwarded-* headers to the outgoing request (Default: false)
 * _proxyImpl_: Switch the proxy implementation. Currently available are:
   * *streamAPI* (based on the Node.js stream API)
   * *nodeHttpProxy* (based on [node-http-proxy](https://github.com/http-party/node-http-proxy))
   * *default* (which is *streamAPI*)

## Provided Services

### MashroomHttpProxyService

The exposed service is accessible through _pluginContext.services.proxy.service_

**Interface:**

```ts
export interface MashroomHttpProxyService {

    /**
     * Forwards the given request to the targetUri and passes the response from the target to the response object.
     * The Promise will always resolve, you have to check response.statusCode to see if the transfer was successful or not.
     * The Promise will resolve as soon as the whole response was sent to the client.
     */
    forward(req: Request, res: Response, targetUri: string, additionalHeaders?: HttpHeaders): Promise<void>;

    /**
     * Forwards a WebSocket request (ws or wss).
     * The passed additional headers are only available at the upgrade/handshake request (most WS frameworks allow you to access it).
     */
    forwardWs(req: IncomingMessageWithContext, socket: Socket, head: Buffer, targetUri: string, additionalHeaders?: HttpHeaders): Promise<void>;

}
```

## Provided Plugin Types

### http-proxy-interceptor

This plugin type can be used to intercept http proxy calls and to add, for example, authentication headers to backend calls.

To register your custom http-proxy-interceptor plugin, create a plugin definition (mashroom.\[json,ts,js,yaml\]) like this:

```json title="mashroom.json"
{
    "plugins": [
        {
            "name": "My Custom Http Proxy Interceptor",
            "type": "http-proxy-interceptor",
            "bootstrap": "./dist/mashroom-bootstrap.js",
            "defaultConfig": {
                "order": 500,
                "myProperty": "foo"
            }
        }
    ]
}
```

* _defaultConfig.order_: The weight of the middleware in the stack—the higher it is, the **later** it will be executed (Default: 1000)

The bootstrap returns the interceptor:

```ts
import type {MashroomHttpProxyInterceptorPluginBootstrapFunction} from '@mashroom/mashroom-http-proxy/type-definitions';

const bootstrap: MashroomHttpProxyInterceptorPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {

    return new MyInterceptor(/* ... */);
};

export default bootstrap;
```

The provider has to implement the following interface:

```ts
interface MashroomHttpProxyInterceptor {


    /**
     * Intercept request to given targetUri.
     *
     * The existingHeaders contain the original request headers, headers added by the MashroomHttpProxyService client and the ones already added by other interceptors.
     * The existingQueryParams contain query parameters from the request and the ones already added by other interceptors.
     *
     * clientRequest is the request that shall be forwarded. DO NOT MANIPULATE IT. Use it to access "method" and "pluginContext".
     *
     * Return null or undefined if you don't want to interfere with a call.
     */
    interceptRequest?(targetUri: string, existingHeaders: Readonly<HttpHeaders>, existingQueryParams: Readonly<QueryParams>,
                      clientRequest: Request, clientResponse: Response):
        Promise<MashroomHttpProxyRequestInterceptorResult | undefined | null>;

    /**
     * Intercept WebSocket request to given targetUri.
     *
     * The existingHeaders contain the original request headers, headers added by the MashroomHttpProxyService client and the ones already added by other interceptors.
     *
     * The changes are ONLY applied to the upgrade request, not to WebSocket messages.
     *
     * Return null or undefined if you don't want to interfere with a call.
     */
    interceptWsRequest?(targetUri: string, existingHeaders: Readonly<HttpHeaders>, clientRequest: IncomingMessageWithContext):
        Promise<MashroomWsProxyRequestInterceptorResult | undefined | null>;

    /**
     * Intercept response from a given targetUri.
     *
     * The existingHeaders contain the original request header and the ones already added by other interceptors.
     * targetResponse is the response that shall be forwarded to the client. DO NOT MANIPULATE IT. Use it to access "statusCode" an such.
     *
     * Return null or undefined if you don't want to interfere with a call.
     */
    interceptResponse?(targetUri: string, existingHeaders: Readonly<HttpHeaders>, targetResponse: IncomingMessage,
                       clientRequest: Request, clientResponse: Response):
        Promise<MashroomHttpProxyResponseInterceptorResult | undefined | null>;

}
```

#### Examples

Add a Bearer token to each request like this (implemented like this in the *mashroom-http-proxy-add-id-token* module):

```ts
export default class MyInterceptor implements MashroomHttpProxyInterceptor {

    async interceptRequest(targetUri: string, existingHeaders: Readonly<HttpHeaders>, existingQueryParams: Readonly<QueryParams>,
                         clientRequest: Request, clientResponse: Response) {
        const logger = clientRequest.pluginContext.loggerFactory('test.http.interceptor');
        const securityService = clientRequest.pluginContext.services.security && clientRequest.pluginContext.services.security.service;

        const user = securityService.getUser(clientRequest);
        if (!user) {
           return;
        }

        return {
           addHeaders: {
              Authorization: `Bearer ${user.secrets.idToken}`
           }
        };
    }
}
```

You could also return forbidden like this:

```ts
export default class MyInterceptor implements MashroomHttpProxyInterceptor {

    async interceptRequest(targetUri: string, existingHeaders: Readonly<HttpHeaders>, existingQueryParams: Readonly<QueryParams>,
                         clientRequest: Request, clientResponse: Response) {

        clientResponse.sendStatus(403);

        return {
          responseHandled: true
        };
    }
}
```

Handle the response instead of the proxy:

```ts
export default class MyInterceptor implements MashroomHttpProxyInterceptor {

    async interceptResponse(targetUri: string, existingHeaders: Readonly<HttpHeaders>, targetResponse: IncomingMessage, clientRequest: ExpressRequest, clientResponse: ExpressResponse) {
        let body = [];
        targetResponse.on('data', function (chunk) {
            body.push(chunk);
        });
        targetResponse.on('end', function () {
            body = Buffer.concat(body).toString();
            console.log("Response from proxied server:", body);
            clientResponse.json({ success: true });
        });

        // NOTE: if you "await" the end event you have to call targetResponse.resume() here
        //  because the interceptor pauses the stream from the target until all interceptors are done

        return {
            responseHandled: true
        };
    }
}
```

Compress request/response body (only supported by the default/*streamAPI* proxy implementation):

```ts
import zlib from 'zlib';

export default class MyInterceptor implements MashroomHttpProxyInterceptor {

    async interceptRequest(targetUri) {
        if (targetUri.startsWith('https://my-backend-server.com')) {
            return {
                addHeaders: {
                    'content-encoding': 'gzip',
                },
                streamTransformers: [
                    zlib.createGzip(),
                ],
            };
        }
    }

    async interceptResponse(targetUri, existingHeaders) {
        if (targetUri.startsWith('https://my-backend-server.com') && existingHeaders['content-encoding'] === 'gzip') {
            return {
                removeHeaders: [
                    'content-encoding',
                ],
                streamTransformers: [
                    zlib.createGunzip(),
                ],
            };
        }
    }
}
```

Encrypt the request/response body (only supported by the default/*streamAPI* proxy implementation):

```ts
import crypto from 'crypto';

export default class MyInterceptor implements MashroomHttpProxyInterceptor {

    async interceptRequest(targetUri) {
        if (targetUri.startsWith('https://my-backend-server.com')) {
            return {
                streamTransformers: [
                    crypto.createCipheriv(/* .... */),
                ],
            };
        }
    }

    async interceptResponse(targetUri, existingHeaders) {
        if (targetUri.startsWith('https://my-backend-server.com')) {
            return {
                streamTransformers: [
                    crypto.reateDecipheriv(/* .... */),
                ],
            };
        }
    }
}
```
