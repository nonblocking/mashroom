
### Mashroom Portal Remote App Registry

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**. 

Adds a remote app registry to _Mashroom Portal_. Scans periodically a list of remote servers for exposed _/package.json_ and
registers portal-apps if found.

It also comes with an Admin Ui (_/portal-remote-app-registry/admin_) and a REST API to add and remote URL's. The Admin UI allows adding a URL 
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

#### Usage

If *node_modules/@mashroom* is configured as plugin path just add this package as _dependency_.

You can override the default config in your Mashroom config file like this:

```json
{
  "plugins": {
        "Mashroom Portal Remote App Registry Webapp": {
            "path": "/portal-remote-app-registry",
            "remotePortalAppUrls": "./remote-portal-apps.json",
            "registrationRefreshIntervalSec": 600,
            "removeAfterNumberOrRetries": 10
        }
    }
}
```
 * _path_: Path of the Admin UI and the REST API (Default: /portal-remote-app-registry)
 * _remotePortalAppUrls_: Location of the config file with the remote URLs, relative to the server config (Default: ./remote-portal-apps.json)
 * _registrationRefreshIntervalSec_: Scan interval (Default: 3600)
 * _removeAfterNumberOrRetries_: Remove remote URL after a number of retries (Default: 100)
 
The config file contains just an array of URL's:

```json
[
    "http://demo-remote-app.mashroom-server.com"
]
``` 

**REST API**

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

