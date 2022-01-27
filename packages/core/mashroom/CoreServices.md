
## Services

### MashroomPluginService

Accessible through _pluginContext.services.core.pluginService_

Interface:

```ts
export interface MashroomPluginService {
    /**
     * The currently known plugin loaders
     */
    getPluginLoaders(): Readonly<MashroomPluginLoaderMap>;

    /**
     * Get all currently known plugins
     */
    getPlugins(): Readonly<Array<MashroomPlugin>>;

    /**
     * Get all currently known plugin packages
     */
    getPluginPackages(): Readonly<Array<MashroomPluginPackage>>;

    /**
     * Register for the next loaded event of given plugin (fired AFTER the plugin has been loaded).
     */
    onLoadedOnce(pluginName: string, listener: () => void): void;

    /**
     * Register for the next unload event of given plugin (fired BEFORE the plugin is going to be unloaded).
     */
    onUnloadOnce(pluginName: string, listener: () => void): void;
}
```

### MashroomMiddlewareStackService

Accessible through _pluginContext.services.core.middlewareStackService_

Interface:

```ts
export interface MashroomMiddlewareStackService {
    /**
     * Check if the stack has given plugin
     */
    has(pluginName: string): boolean;

    /**
     * Execute the given middleware.
     * Throws an exception if it doesn't exists
     */
    apply(
        pluginName: string,
        req: Request,
        res: Response,
    ): Promise<void>;

    /**
     * Get the ordered list of middleware plugin (first in the list is executed first)
     */
    getStack(): Array<{pluginName: string; order: number}>;
}
```

### MashroomHttpUpgradeService

Accessible through _pluginContext.services.core.websocketUpgradeService_

Interface:

```ts
/**
 * A services to add and remove HTTP/1 upgrade listeners
 */
export interface MashroomHttpUpgradeService {
    /**
     * Register an upgrade handler for given path
     */
    registerUpgradeHandler(handler: MashroomHttpUpgradeHandler, pathExpression: string | RegExp): void;
    /**
     * Unregister an upgrade handler
     */
    unregisterUpgradeHandler(handler: MashroomHttpUpgradeHandler): void;
}
```

### MashroomHealthProbeService

A service that allows it plugins to register health probes.
If a probe fails the server state goes to unready.

```ts
/**
 * A services to obtain all available health probes
 */
export interface MashroomHealthProbeService {
    /**
     * Register a new health probe for given plugin
     */
    registerProbe(forPlugin: string, probe: MashroomHealthProbe): void;
    /**
     * Unregister a health probe for given plugin
     */
    unregisterProbe(forPlugin: string): void;
    /**
     * Get all registered probes
     */
    getProbes(): Readonly<Array<MashroomHealthProbe>>;
}
```

You can use it like this in your plugin bootstrap:

```ts
const bootstrap: MashroomStoragePluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {services: {core: {pluginService, healthProbeService}}} = pluginContextHolder.getPluginContext();

    healthProbeService.registerProbe(pluginName, healthProbe);

    pluginService.onUnloadOnce(pluginName, () => {
        healthProbeService.unregisterProbe(pluginName);
    });

    // ...
};
```

## Plugin Types

### plugin-loader

A _plugin-loader_ plugin adds support for a custom plugin type.

To register a new plugin-loader add this to _package.json_:

```json
{
    "mashroom": {
        "plugins": [
            {
                "name": "My Custom Plugin Loader",
                "type": "plugin-loader",
                "bootstrap": "./dist/mashroom-bootstrap",
                "loads": "my-custom-type",
                "defaultConfig": {
                   "myProperty": "foo"
                }
            }
        ]
    }
}
```

* _loads_: The plugin type this loader can handle

After that all plugins of type _my-custom-type_ will be passed to your custom loader instantiated by the bootstrap script:

```ts
import type {
    MashroomPluginLoader, MashroomPlugin, MashroomPluginConfig, MashroomPluginContext,
    MashroomPluginLoaderPluginBootstrapFunction
} from 'mashroom/type-definitions';

class MyPluginLoader implements MashroomPluginLoader {

    get name(): string {
        return 'My Plugin Loader';
    }

    generateMinimumConfig(plugin: MashroomPlugin) {
        return {};
    }

    async load(plugin: MashroomPlugin, config: MashroomPluginConfig, context: MashroomPluginContext) {
        // TODO
    }

    async unload(plugin: MashroomPlugin) {
        // TODO
    }
}

const myPluginLoaderPlugin: MashroomPluginLoaderPluginBootstrapFunction = (pluginName, pluginConfig, pluginContextHolder) => {
    return new MyPluginLoader();
};

export default myPluginLoaderPlugin;
```

### web-app

Registers a *Express* webapp that will be available at a given path.

To register a web-app plugin add this to _package.json_:

```json
{
     "mashroom": {
        "plugins": [
            {
                "name": "My Webapp",
                "type": "web-app",
                "bootstrap": "./dist/mashroom-bootstrap.js",
                "defaultConfig": {
                    "path": "/my/webapp",
                    "myProperty": "foo"
                }
            }
        ]
     }
}
```

* _defaultConfig.path_: The default path where the webapp will be available

And the bootstrap just returns the *Express* webapp:

```ts
import webapp from './webapp';

import type {MashroomWebAppPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomWebAppPluginBootstrapFunction = async () => {
    return webapp;
};

export default bootstrap;
```

*Additional handlers*

It is also possible to return handlers in the bootstrap. Currently there is only one:
* _upgradeHandler_: Handle HTTP Upgrades (e.g. upgrade to WebSocket). Alternatively you could use *MashroomWebsocketUpgradeService* directly

Example:

```ts
const bootstrap: MashroomWebAppPluginBootstrapFunction = async () => {
    return {
        expressApp: webapp,
        upgradeHandler: (request: IncomingMessageWithContext, socket: Socket, head: Buffer) => {
            // TODO
        },
    };
};

```

### api

Registers a *Express* _Router_ (a REST API) and makes it available at a given path.

To register a API plugin add this to _package.json_:

```json
{
     "mashroom": {
        "plugins": [
            {
                "name": "My REST API",
                "type": "api",
                "bootstrap": "./dist/mashroom-bootstrap.js",
                "defaultConfig": {
                    "path": "/my/api",
                    "myProperty": "foo"
                }
            }
        ]
    }
}
```

* _defaultConfig.path_: The default path where the api will be available

And the bootstrap just returns the *Express* router:

```ts
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  // ...
});

import type {MashroomApiPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomApiPluginBootstrapFunction = async () => {
    return router;
};

export default bootstrap;

```

### middleware

Registers a *Express* middleware and adds it to the global middleware stack.

To register a middleware plugin add this to package.json:

```json
{
    "mashroom": {
        "plugins": [{
            "name": "My Middleware",
            "type": "middleware",
            "bootstrap": "./dist/mashroom-bootstrap.js",
            "defaultConfig": {
                "order": 500,
                "myProperty": "foo"
            }
        }]
    }
}
```

* _defaultConfig.order_: The weight of the middleware in the stack - the higher it is the **later** it will be executed (Default: 1000)

And the bootstrap just returns the *Express* middleware:

```ts
import MyMiddleware from './MyMiddleware';

import type {MashroomMiddlewarePluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomMiddlewarePluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const pluginContext = pluginContextHolder.getPluginContext();
    const middleware = new MyMiddleware(pluginConfig.myProperty, pluginContext.loggerFactory);
    return middleware.middleware();
};

export default bootstrap;
```

### static

Registers some static resources and exposes it at a given path (via *Express* static).

To register a static plugin add this to package.json:

```json
{
    "mashroom": {
        "plugins": [{
            "name": "My Documents",
            "type": "static",
            "documentRoot": "./my-documents",
            "defaultConfig": {
                "path": "/my/docs"
            }
        }]
    }
}
```

* _documentRoot_: Defines the local root path of the documents
* _defaultConfig.path_: The default path where the documents will be available

### services

Used to load arbitrary shared code that can be loaded via _pluginContext_.

To register a service plugin add this to package.json:

```json
{
    "mashroom": {
        "plugins": [{
            "name": "My Services",
            "type": "services",
            "namespace": "myNamespace",
            "bootstrap": "./dist/mashroom-bootstrap.js",
            "defaultConfig": {
            }
        }]
    }
}
```

* _namespace_: Defines the path to the services. In this case _MyService_ will be accessible through _pluginContext.services.myNamespace.service_

The bootstrap will just return an object with a bunch of services:

```ts
import MyService from './MyService';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const pluginContext = pluginContextHolder.getPluginContext();
    const service = new MyService(pluginContext.loggerFactory);

    return {
        service,
    };
};

export default bootstrap;
```

### admin-ui-integration

A simple plugin to register an arbitrary *web-app* or *static* plugin as panel in the Admin UI.

To register an admin-ui-integration plugin add this to package.json:

```json
{
    "mashroom": {
        "plugins": [{
            "name": "My Admin Panel Integration",
            "type": "admin-ui-integration",
            "requires": [
                "My Admin Panel"
            ],
            "target": "My Admin Panel",
            "defaultConfig": {
                "menuTitle": "My Admin Panel",
                "path": "/my-admin-panel",
                "height": "80vh",
                "weight": 10000
            }
        }]
    }
}
```

* _target_: The actual web-app or static plugin that should be integrated
* _defaultConfig.menuTitle_: The name that should be appear in the Admin UI menu
* _defaultConfig.path_: The path in the Admin UI (full path will be /mashroom/admin/ext/\<your path>)
* _defaultConfig.height_: The height of the iframe that will contain the target webapp (Default: 80vh)
  If you want that the iframe has the full height of the webapp you have to post the height periodically to
  the parent, like so
  ```js
    parent.postMessage({ height: contentHeight + 20 }, "*");
  ```
* _defaultConfig.weight_: The weight of the menu entry, the higher the number the lower will be menu entry be (Default: 100)
