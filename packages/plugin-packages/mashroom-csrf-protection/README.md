
# Mashroom CSRF Protection

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

If you add this plugin all updating HTTP methods (such as POST, PUT and DELETE)
must contain a CSRF token automatically generated for the session. Otherwise the request will be rejected.

There are two ways to pass the token:

* As HTTP header _X-CSRF-Token_
* As query parameter _csrfToken_

You can use the _MashroomCSRFService_ to get the current token.

_Mashroom Portal_ automatically uses this plugin to secure all requests if available.

#### Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-csrf-protection** as *dependency*.

After that you can use the service like this:

```js
// @flow

import type {MashroomCacheControlService} from '@mashroom/mashroom-csrf-protection/type-definitions';

export default (req: ExpressRequest, res: ExpressResponse) => {

    const csrfService: MashroomCacheControlService = req.pluginContext.services.csrf.service;
    const token = csrfService.getCSRFToken(req);

    // ...
}
```

You can override the default config in your Mashroom config file like this:

```json
{
  "plugins": {
        "Mashroom CSRF Middleware": {
            "safeMethods": ["GET", "HEAD", "OPTIONS"]
        },
        "Mashroom CSRF Services": {
            "saltLength": 8,
            "secretLength": 18
        }
    }
}
```

 * _safeMethods_: List of HTTP methods that require no CSRF token check
 * _saltLength_ and _secretLength_ are passed to the [csrf](https://www.npmjs.com/package/csrf) package.

## Services

### MashroomCSRFService

The exposed service is accessible through _pluginContext.services.csrf.service_

**Interface:**

```js

export interface MashroomCSRFService {

    /**
     * Get the current CSRF token for this session
     */
    getCSRFToken(request: ExpressRequest): string;

    /**
     * Check if the given token is valid
     */
    isValidCSRFToken(request: ExpressRequest, token: string): boolean;
}

```

