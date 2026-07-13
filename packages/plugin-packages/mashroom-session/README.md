
# Mashroom Session

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin adds [Express session](https://www.npmjs.com/package/express-session) as middleware.

## Usage

If *node_modules/@mashroom* is configured as a plugin path, add **@mashroom/mashroom-session** as *dependency*.

You can override the default config in your server config file like this:

```json
{
    "plugins": {
        "Mashroom Session Middleware": {
            "order": -100,
            "provider": "Mashroom Session Filestore Provider",
            "session": {
                "secret": "EWhQ5hvETGkqvPDA",
                "resave": false,
                "saveUninitialized": false,
                "cookie": {
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
    * _cookie.maxAge_: Max cookie age in ms, which should be the max expected session duration (Default 2h)

**Security hints**:

  * Change the default _secret_
  * You should consider setting _cookie.sameSite_ to either "lax" or "strict" (CSRF protection).

## Provided Plugin Types

### session-store-provider

This plugin type adds a session store that can be used by this plugin.

To register a custom session-store-provider plugin, create a plugin definition (mashroom.\[json,ts,js,yaml\]) like this:

```json
{
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
```

The bootstrap returns the express session store (here, for example, the file store):

```ts
import sessionFileStore from 'session-file-store';

import type {MashroomSessionStoreProviderPluginBootstrapFunction} from '@mashroom/mashroom-session/type-definitions';

const bootstrap: MashroomSessionStoreProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder, expressSession) => {
    const options = {...pluginConfig};
    const FileStore = sessionFileStore(expressSession);
    return new FileStore(options);
};

export default bootstrap;
```

