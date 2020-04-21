
# Mashroom Virtual Host Path Mapper

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

This plugin adds the possibility to map external paths to internal ones based on virtual host.
This is required for web-apps that need to know the actual "base path" to generate URLs (in that case rewriting via reverse proxy won't work).

For example *Mashroom Portal* can use this to move *Sites* to different paths but keep the ability to generate
absolute paths for resources and API calls. Which is useful if you want to expose specific *Sites* via a virtual host.

All other plugins will only deal with the rewritten paths, keep that in mind especially when defining ACLs.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-vhost-path-mapper** as *dependency*.

To map for example a portal site to *www.my-company.com/web* configure the reverse proxy like this:

    www.my-company.com/web -> <portal-host>:<portal-port>/

and the plugin like this:

```json
{
  "plugins": {
       "Mashroom VHost Path Mapper Middleware": {
           "considerHttpHeaders": ["x-my-custom-host-header", "x-forwarded-host"],
           "hosts": {
              "www.my-company.com": {
                 "frontendBasePath": "/web",
                 "mapping": {
                    "/login": "/login",
                    "/": "/portal/public-site"
                 }
              },
              "localhost:8080": {
                 "/": "/local-test"
              }
          }
       }
    }
}
```

That means if someone accesses *Mashroom Server* via *https://www.my-company.com/web/test* the request will hit
the path */portal/public-site/test*.

It also works the other way round. If the server redirects to */login* it would be changed to */web/login* (in this example).

Port based virtual hosts (like localhost:8080) are also possible but only if the request still contains the original *host* header
(and no *X-Forwarded-Host* different from the *host* header).

The mapping rules do not support regular expressions.

The *frontendBasePath* is optional and */* by default.

The *considerHttpHeaders* property is also optional and can be used to detect the host based on some custom header.
The first header that is present will be used (so the order in the list specifies the priority).

## Services

### MashroomVHostPathMapperService

The exposed service is accessible through _pluginContext.services.vhostPathMapper.service_

**Interface:**

```js
export interface MashroomVHostPathRewriteService {

    /**
     * Get the details if the url of the current path has been rewritten
     */
    getMappingInfo(request: ExpressRequest): ?RequestVHostMappingInfo;

}
```
