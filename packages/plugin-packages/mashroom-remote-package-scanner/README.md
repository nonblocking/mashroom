
# Mashroom Remote Package Scanner

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin adds support for arbitrary remote plugin packages.
It takes a list of URLs which will be checked for plugins. It also comes with an Admin UI to add new URLs dynamically.

> [!IMPORTANT]
> A remote plugin package **must** expose a */mashroom.json* file and/or a */package.json* file containing the plugin description.
> It is recommended to expose the */package.json* file in any case, because the version property there is used for cache busting.

Currently, only the following plugin types are known to be supported:

 * portal-app
 * portal-app2
 * portal-layouts
 * portal-page-enhancement (only if no bootstrap is defined)

## Usage

If *node_modules/@mashroom* is configured as a plugin path, add **@mashroom/mashroom-remote-package-scanner** as *dependency*.

You can override the default config in your Mashroom server config like this:

```json
{
  "plugins": {
      "Mashroom Remote Package Scanner": {
          "remotePackageUrls": "./remotePackageUrls.json"
      },
      "Mashroom Remote Package Scanner Background Job": {
          "cronSchedule": "0/1 * * * *",
          "registrationRefreshIntervalSec": 600
      },
      "Mashroom Remote Package Scanner Admin Webapp": {
          "showAddRemotePluginPackageForm": true
      }
  }
}
```

* _remotePackageUrls_: Location of the config file with the remote URLs, relative to the server config (Default: ./remotePackageUrls.json)
* _cronSchedule_: The cron schedule for the background job that scans for packages (Default: every minute)
* _registrationRefreshIntervalSec_: Interval for refreshing known packages (Default: 600)
* _showAddRemotePluginPackageForm_: Show the *Add a new Remote Package URL* form in the Admin UI

The *remotePackageUrls* config file contains just a list of URLs:

```json
{
    "$schema": "https://www.mashroom-server.com/schemas/mashroom-remove-package-scanner.json",
    "remotePackageUrls": [
        "http://demo-remote-app.mashroom-server.com"
    ]
}
```

> [!NOTE] Only HTTP(S) URLs are supported.
