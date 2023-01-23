
# Mashroom Portal Remote App Registry

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin adds a remote app registry to _Mashroom Portal_, which scans periodically a list of remote servers for Portal Apps.
It expects the _package.json_ and optionally an external plugin config file (default _mashroom.json_) to be exposed at _/_.
It also expects a _remote_ config in the plugin definition, like this:

```json
 {
    "name": "My Single Page App",
    "remote": {
        "resourcesRoot": "/public",
         "ssrInitialHtmlPath": "/ssr"
    }
 }
```

You can find an example remote app here: [Mashroom Demo Remote Portal App](https://github.com/nonblocking/mashroom-demo-remote-portal-app).

This plugin also comes with an Admin UI extension (_/mashroom/admin/ext/remote-portal-apps_) and a REST API to add and remote URL's. The Admin UI allows adding a URL
temporary only for the current session.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-portal-remote-app-registry** as *dependency*.

You can override the default config in your Mashroom config file like this:

```json
{
  "plugins": {
      "Mashroom Portal Remote App Background Job": {
          "cronSchedule": "0/1 * * * *",
          "socketTimeoutSec": 3,
          "registrationRefreshIntervalSec": 600,
          "unregisterAppsAfterScanErrors": -1
      },
      "Mashroom Portal Remote App Registry": {
          "remotePortalAppUrls": "./remotePortalApps.json"
      },
      "Mashroom Portal Remote App Registry Admin Webapp": {
          "showAddRemoteAppForm": true
      }
  }
}
```

 * _cronSchedule_: The cron schedule for the background job that scans for new apps (Default: every minute)
 * _socketTimeoutSec_: Socket timeout when trying to reach the remote app (Default: 3)
 * _registrationRefreshIntervalSec_: Interval for refreshing known endpoints (Default: 600)
 * _unregisterAppsAfterScanErrors_: Remove registered Apps of an endpoint if it cannot be reached for a number of scan intervals (Default: -1 which means: never remove)
 * _remotePortalAppUrls_: Location of the config file with the remote URLs, relative to the server config (Default: ./remotePortalApps.json)
 * _showAddRemoteAppForm_: Show the *Add a new Remote Portal App Endpoint* form in the Admin UI

The config file contains just a list of URLs:

```json
{
    "$schema": "https://www.mashroom-server.com/schemas/mashroom-portal-remote-apps.json",
    "remotePortalApps": [
        "http://demo-remote-app.mashroom-server.com"
    ]
}
```

The **Service** can be used like this:

```ts
import type {MashroomPortalRemoteAppEndpointService} from '@mashroom/mashroom-portal-remote-app-registry/type-definitions';

export default async (req: Request, res: Response) => {
    const remoteAppService: MashroomPortalRemoteAppEndpointService = req.pluginContext.services.remotePortalAppEndpoint.service;

    const remoteApps = await remoteAppService.findAll();

    // ...
}
```

The **REST API** can be used like this:

Available at _/portal-remote-app-registry/api_. Methods:

 * _GET /_ : List of current URL's
 * _POST /_ : Add a new URL. Request body:
    ```json
    {
       "url": "http://my-server.com/app1",
       "sessionOnly": false
    }
    ```
 * _DELETE /&lt;url&gt;_ : Delete given URL

## Services

### MashroomPortalRemoteAppEndpointService

The exposed service is accessible through _pluginContext.services.remotePortalAppEndpoint.service_

**Interface:**

```ts
export interface MashroomPortalRemoteAppEndpointService {
    /**
     * Register a new Remote App URL
     */
    registerRemoteAppUrl(url: string): Promise<void>;

    /**
     * Register a Remote App URL only for the current session (useful for testing)
     */
    synchronousRegisterRemoteAppUrlInSession(
        url: string,
        request: Request,
    ): Promise<void>;

    /**
     * Unregister a Remote App
     */
    unregisterRemoteAppUrl(url: string): Promise<void>;

    /**
     * Find Remote App by URL
     */
    findRemotePortalAppByUrl(
        url: string,
    ): Promise<RemotePortalAppEndpoint | null | undefined>;

    /**
     * Return all known Remote App endpoints
     */
    findAll(): Promise<Readonly<Array<RemotePortalAppEndpoint>>>;

    /**
     * Update an existing Remote App endpoint
     */
    updateRemotePortalAppEndpoint(
        remotePortalAppEndpoint: RemotePortalAppEndpoint,
    ): Promise<void>;

    /**
     * Refresh (fetch new metadata) from given endpoint
     */
    refreshEndpointRegistration(
        remotePortalAppEndpoint: RemotePortalAppEndpoint,
    ): Promise<void>;
}
```
