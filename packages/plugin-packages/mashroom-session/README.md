
# Mashroom Session

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

This plugin adds [Express session](https://www.npmjs.com/package/express-session) as middleware.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-session** as *dependency*.

You can override the default config in your Mashroom config file like this:

```json
{
    "plugins": {
        "Mashroom Storage Services": {
            "order": -100,
            "provider": "Mashroom Session Filestore Provider",
            "session": {
                "secret": "keyboard cat",
                "resave": false,
                "saveUninitialized": true,
                "cookie": {
                    "maxAge": 1200000,
                    "httpOnly": true,
                    "secure": false,
                    "sameSite": false
                }
            }
        }
    }
}
```

 * _order_: The middleware order (Default: -100)
 * _provider_: The plugin from type _session-store-provider_ that implements the store (Default: memory)
 * _session_: The properties are just passed to express-session. See [Express session](https://www.npmjs.com/package/express-session) for possible options.
    * _cookie.maxAge_: Max session age in ms (Default 20min)

**Security hints**

For production you should enable _cookie.secure_ and consider setting _cookie.sameSite_ to either "lax" or "strict" (CSRF protection).

## Plugin Types

### session-store-provider

Registers a Security Store Provider that can be used by this plugin.

To register a session-store-provider plugin add this to _package.json_:

```json
{
    "mashroom": {
        "plugins": [
            {
                "name": "My Session Provider",
                "type": "session-store-provider",
                "bootstrap": "./dist/mashroom-bootstrap.js",
                "defaultConfig": {
                    "myProperty": "test"
                }
            }
        ]
    }
}
```

The bootstrap returns the express session store (here for example the file store):

```js
// @flow

import sessionFileStore from 'session-file-store';

import type {MashroomSessionStoreProviderPluginBootstrapFunction} from '@mashroom/mashroom-session/type-definitions';

const bootstrap: MashroomSessionStoreProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder, expressSession) => {
    const options = Object.assign({}, pluginConfig);
    const FileStore = sessionFileStore(expressSession);
    return new FileStore(options);
};

export default bootstrap;
```

