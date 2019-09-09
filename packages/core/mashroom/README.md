
### Mashroom Server 

[Mashroom Server](https://www.mashroom-server.com) is a *Node.js* based **Integration Platform for Microfrontends**. 
 
This package contains the core of _Mashroom Server_. It contains core services for managing plugins and default plugin loaders
for *Express* middleware, *Express* webapps and shared code as _services_. It also provides a common logging infrastructure.

From a technical point of view this is s a plugin loader that scans npm packages (_package.json_) for plugin definitions and loads them at runtime. 
Such a plugin could be an *Express* webapp or a *SPA* or more generally all kind of code it knows how to load, 
which is determined by the available plugin loaders. Plugin loaders itself are also just plugins so it is possible to extend the list of known plugin types.

#### Usage

The easiest way to start is to clone one of the quickstart repositories: 
 * [mashroom-quickstart](https://github.com/nonblocking/mashroom-quickstart)
 * [mashroom-portal-quickstart](https://github.com/nonblocking/mashroom-portal-quickstart)

You can find a full documentation with a setup and configuration guide here: [https://www.mashroom-server.com/documentation](https://www.mashroom-server.com/documentation)

#### Services

##### MashroomPluginService

Accessible through _pluginContext.services.core.pluginService_

Interface:

```js
 /**
  * Mashroom plugin service
  */
 export interface MashroomPluginService {
     /**
      * The currently known plugin loaders
      */
     getPluginLoaders(): MashroomPluginLoaderMap;
     /**
      * Get all currently known plugins
      */
     getPlugins(): Array<MashroomPlugin>;
     /**
      * Get all currently known plugin packages
      */
     getPluginPackages(): Array<MashroomPluginPackage>;
 }   
```

##### MashroomMiddlewareStackService

Accessible through _pluginContext.services.core.middlewareStackService_

Interface:

```js
/**
 * A service to access and introspect the middleware stack
 */
export interface MashroomMiddlewareStackService {
    /**
     * Check if the stack has given plugin
     */
    has(pluginName: string): boolean;
    /**
     * Execute the given middleware.
     * Throws an exception if it doesn't exists
     */
    apply(pluginName: string, req: ExpressRequest, res: ExpressResponse): Promise<void>;
    /**
     * Get the ordered list of middleware plugin (first in the list is executed first)
     */
    getStack(): Array<{ pluginName: string, order: number }>;
} 
```

#### Plugin Types

##### plugin-loader

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

```js
// @flow

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


##### web-app

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

```js
// @flow

import webapp from './webapp';

import type {MashroomWebAppPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomWebAppPluginBootstrapFunction = async () => {
    return webapp;
};

export default bootstrap;
```

** Additional handlers **

It is possible to return handlers in the bootstrap as well. Currently there a two additional handlers:
 * _upgradeHandler_: Handle HTTP Upgrades (e.g. upgrade to WebSocket)
 * _onUnload_: Called when the webapp is unloaded or reloaded
 
Example: 

```js
const bootstrap: MashroomWebAppPluginBootstrapFunction = async () => {
    return {
        expressApp: webapp,
        upgradeHandler: (request: HttpServerRequest, socket: net$Socket, head: Buffer) => {
            // TODO
        },
        onUnload: () => {
            // TODO
        }    
    };
};

```

##### api

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

```js
// @flow

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

##### middleware

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

 * _defaultConfig.order_: he weight of the middleware in the stack - the higher it is the **later** it will be executed

And the bootstrap just returns the *Express* middleware:

```js
// @flow

import MyMiddleware from './MyMiddleware';

import type {MashroomMiddlewarePluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomMiddlewarePluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const pluginContext = pluginContextHolder.getPluginContext();
    const middleware = new MyMiddleware(pluginConfig.myProperty, pluginContext.loggerFactory);
    return middleware.middleware();
};

export default bootstrap;
```

##### static

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

##### services

Used to load arbitrary shared code that can be loaded via _pluginContext_.

To register a service plugin add this to package.json:

```json
{
    "mashroom": {
        "plugins": [{
            "name": "My services Services",
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

```js
// @flow

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

