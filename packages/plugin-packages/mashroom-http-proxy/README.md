
# Mashroom HTTP proxy

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

Adds a service for forwarding requests to a target URI.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-http-proxy** as *dependency*.

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

You can override the default config in your Mashroom config file like this:

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
              "uber-trace-id",
              "uberctx-",
              "b3",
              "x-b3-*",
              "trace*"
            ],
            "rejectUnauthorized": true,
            "poolMaxSockets": 10,
            "socketTimeoutMs": 60000
        }
    }
}
```
 * _forwardMethods_: The methods that should be forwarded
 * _forwardHeaders_: The http headers that should be forwarded. May contain a _*_ as wildcard.
 * _rejectUnauthorized_: Reject self-signed certificates (Default: true)
 * _poolMaxSockets_: Max pool size for connections (Default: 10)
 * _socketTimeoutMs_: Socket timeout, 0 means no timeout (Default: 30000 - 30sec)

## Services

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

}
```

## Plugin Types

### http-proxy-interceptor

This plugin type can be used to intercept http proxy calls and to add for example authentication headers to backend calls.

To register your custom http-proxy-interceptor plugin add this to _package.json_:

```json
{
    "mashroom": {
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
}
```

* _defaultConfig.order_: the weight of the middleware in the stack - the higher it is the **later** it will be executed (default: 1000)

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
     * clientRequest is the request that shall be forwarded. DO NOT MANIPULATE IT. Just use it to access "method" and "pluginContext".
     *
     * Return null or undefined if you don't want to interfere with a call.
     */
    interceptRequest(targetUri: string, existingHeaders: Readonly<HttpHeaders>, existingQueryParams: Readonly<QueryParams>,
                     clientRequest: Request, clientResponse: Response):
        Promise<MashroomHttpProxyRequestInterceptorResult | undefined | null>;

    /**
     * Intercept response from given targetUri.
     *
     * The existingHeaders contain the original request header and the ones already added by other interceptors.
     * targetResponse is the response that shall be forwarded to the client. DO NOT MANIPULATE IT. Just use it to access "statusCode" an such.
     *
     * Return null or undefined if you don't want to interfere with a call.
     */
    interceptResponse(targetUri: string, existingHeaders: Readonly<HttpHeaders>, targetResponse: IncomingMessage,
                      clientRequest: Request, clientResponse: Response):
        Promise<MashroomHttpProxyResponseInterceptorResult | undefined | null>;
}
```

As an example you could add a Bearer token to each request like this:

```ts
export default class MyInterceptor implements MashroomHttpProxyInterceptor {

    async interceptRequest(ttargetUri: string, existingHeaders: Readonly<HttpHeaders>, existingQueryParams: Readonly<QueryParams>,
                         clientRequest: Request, clientResponse: Response) {
        const logger = clientRequest.pluginContext.loggerFactory('test.http.interceptor');
        const securityService = pluginContext.services.security && req.pluginContext.services.security.service;

        const user = securityService.getUser(clientRequest);
        if (!user) {
           return;
        }

        return {
           addHeaders: {
              Authorization: `Bearer ${user.secrets.accessToken}`
           }
        };
    }

    async interceptResponse() {
      return null;
    }
}
```

Or return forbidden for some reason:
```ts
export default class MyInterceptor implements MashroomHttpProxyInterceptor {

    async interceptRequest(targetUri: string, existingHeaders: Readonly<HttpHeaders>, existingQueryParams: Readonly<QueryParams>,
                         clientRequest: Request, clientResponse: Response) {

        clientResponse.sendStatus(403);

        return {
          responseHandled: true
        };
    }

    async interceptResponse() {
        return null;
    }
}
```

Or even manipulate the response:
```ts
export default class MyInterceptor implements MashroomHttpProxyInterceptor {

    async interceptRequest() {
        return null;
    }

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

        return {
            responseHandled: true
        };
    }
}
```
