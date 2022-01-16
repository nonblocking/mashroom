
# Mashroom Browser Cache

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin adds a Service to manage cache control headers. It also allows to disable the cache globally.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-browser-cache** as *dependency*.

After that you can use the service like this:

```ts
import type {MashroomCacheControlService} from '@mashroom/mashroom-browser-cache/type-definitions';

export default async (req: Request, res: Response) => {

    const cacheControlService: MashroomCacheControlService = req.pluginContext.services.browserCache.cacheControl;
    await cacheControlService.addCacheControlHeader('ONLY_FOR_ANONYMOUS_USERS', req, res);

    // ..
};
```

You can override the default config in your Mashroom config file like this:

```json
{
  "plugins": {
        "Mashroom Cache Control Services": {
            "disabled": false,
            "maxAgeSec": 31536000
        }
    }
}
```
 * _disabled_: Disable browser caching (default: false)
 * _maxAgeSec_: Max age in seconds (default: 31536000 (30d))

## Services

### MashroomCacheControlService

The Cache Control service is accessible through _pluginContext.services.browserCache.cacheControl_

**Interface:**

```ts
export interface MashroomCacheControlService {
    /**
     * Add the Cache-Control header based on the policy and authentication status.
     */
     addCacheControlHeader(cachingPolicy: CachingPolicy, request: Request, response: Response): void;

    /**
     * Remove a previously set Cache-Control header
     */
     removeCacheControlHeader(response: Response): void;
}
```

Caching Policies are:

```ts
export type CachingPolicy =  'SHARED' | 'PRIVATE_IF_AUTHENTICATED' | 'NEVER' | 'ONLY_FOR_ANONYMOUS_USERS';
```
