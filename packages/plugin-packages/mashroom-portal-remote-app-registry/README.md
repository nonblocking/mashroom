
# Mashroom Portal Remote App Registry

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

Adds a remote app registry to _Mashroom Portal_. Scans periodically a list of remote servers for Portal Apps.
It expects the _package.json_ (containing a _mashroom_ property) to be exposed at _/_. You can find an example
remote app here: [Mashroom Demo Remote Portal App](https://github.com/nonblocking/mashroom-demo-remote-portal-app).

It also comes with an Admin UI (_/portal-remote-app-registry/admin_) and a REST API to add and remote URL's. The Admin UI allows adding a URL
temporary only for the current session.

Rewrites the _resourcesRoot_ and rest proxy _targetUri_ properties if necessary (when they point to the local filesystem or localhost).

*Example:*

```json
{
    "name": "My App On A Remote Server",
    "defaultConfig": {
         "resourcesRoot": "./dist",
         "restProxies": {
             "bff": {
                 "targetUri": "http://localhost/app1/api"
             }
         }
     }
}

```

Hosted on _http://my-server.com/app1_ it will be converted to:

```json
{
    "name": "My App On A Remote Server",
    "defaultConfig": {
        "resourcesRoot": "http://my-server.com/app1",
        "restProxies": {
            "bff": {
                "targetUri": "http://my-server.com/app1/api"
            }
        }
    }
}
```

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-portal-remote-app-registry** as *dependency*.

You can override the default config in your Mashroom config file like this:

```json
{
  "plugins": {
      "Mashroom Portal Remote App Background Job": {
          "cronSchedule": "0/1 * * * *",
          "socketTimeoutSec": 3,
          "registrationRefreshIntervalSec": 3600
      },
      "Mashroom Portal Remote App Registry": {
          "remotePortalAppUrls": "./remote-portal-apps.json"
      },
      "Mashroom Portal Remote App Registry Admin Webapp": {
          "showAddRemoteAppForm": true
      }
  }
}
```

 * _cronSchedule_: The cron schedule for the background job that scans for new apps (default: every minute)
 * _socketTimeoutSec_: Socket timeout when trying to reach the remote app (default: 3)
 * _registrationRefreshIntervalSec_: Scan interval (default: 3600)
 * _remotePortalAppUrls_: Location of the config file with the remote URLs, relative to the server config (default: ./remote-portal-apps.json)
 * _showAddRemoteAppForm_: Show the *Add a new Remote Portal App Endpoint* form in the Admin UI

The config file contains just an array of URL's:

```json
[
    "http://demo-remote-app.mashroom-server.com"
]
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
