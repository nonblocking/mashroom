
# Mashroom CDN

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin adds a Service to manage CDN hosts.
It basically just returns a host from a configurable list, which can be used to access an asset via CDN.

<span class="panel-info">
**NOTE**: The *mashroom-cdn* plugin requires a CDN that works like a transparent proxy, which forwards an identical request to
the *origin* (in this case Mashroom) if does not exist yet.
</span>

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-cdn** as *dependency*.

After that you can use the service like this:

```ts
import type {MashroomCDNService} from '@mashroom/mashroom-cdn/type-definitions';

export default async (req: Request, res: Response) => {

    const cdnService: MashroomCDNService = req.pluginContext.services.cdn.service;

    const cdnHost = cdnService.getCDNHost();
    const resourceUrl = `${cdnHost}/<the-actual-path>`;

    // ..
};
```

You can override the default config in your Mashroom config file like this:

```json
{
  "plugins": {
        "Mashroom CDN Services": {
            "cdnHosts": [
                "//cdn1.myhost.com",
                "//cdn2.myhost.com"
            ]
        }
    }
}
```
 * _cdnHosts_: A list of CDN hosts (default: [])

## Services

### MashroomCDNService

The CDN service is accessible through _pluginContext.services.cdn.cacheControl_

**Interface:**

```ts
export interface MashroomCDNService {
    /**
     * Return a CDN host or null if there is none configured.
     */
    getCDNHost(): string | null;
}
```
