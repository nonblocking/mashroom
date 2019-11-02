
### Mashroom Browser Cache

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**. 

This plugin adds a Service to manage cache control headers. It allows to disable the cache globally.

#### Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-browser-cache** as *dependency*.

After that you can use the service like this:

```js
// @flow

import type {MashroomCacheControlService} from '@mashroom/mashroom-browser-cache/type-definitions';

export default async (req: ExpressRequest, res: ExpressResponse) => {

    const cacheControlService: MashroomCacheControlService = req.pluginContext.services.browserCache.cacheControl;
    await cacheControlService.addCacheControlHeader(req, res);
        
    // ..
};
```

You can override the default config in your Mashroom config file like this:

```json
{
  "plugins": {
        "Mashroom Cache Control Services": {
            "disabled": false,
            "disabledWhenAuthenticated": false,
            "maxAgeSec": 1800
        }
    }
}
```
 * _disabled_: Disable browser caching (default: false)
 * _disabledWhenAuthenticated_: Disable browser caching when the user is authenticated (default: false)
 * _maxAgeSec_: Max age in seconds (default: 1800)

#### Services

##### MashroomCacheControlService

The Cache Control service is accessible through _pluginContext.services.browserCache.cacheControl_

**Interface:**

```js
export interface MashroomCacheControlService {
    
     /**
      * Add the Cache-Control header based on the settings and authentication status
      */
     addCacheControlHeader(request: ExpressRequest, response: ExpressResponse): Promise<void>;
 
     /**
      * Remove a previously set Cache-Control header
      */
     removeCacheControlHeader(response: ExpressResponse): void;
     
}

```

