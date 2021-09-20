
# Mashroom Add ID Token Http Proxy Interceptor

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

If you add this plugin it will add the ID/JWT token from the OpenId Connect plugin to every backend call.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-csrf-protection** as *dependency*.

You can override the default config in your Mashroom config file like this:

```json
{
  "plugins": {
        "Mashroom Http Proxy Add ID Token Interceptor": {
            "addBearer": false,
            "idTokenHeader": "X-USER-ID-TOKEN",
            "targetUris": [".*"]
        }
    }
}
```

 * _addBearer_: Add the token as authorization bearer header (Default: false)
 * _idTokenHeader_: The HTTP header for the ID token - has no effect if _addBearer_ is true (Default: X-USER-ID-TOKEN)
 * _targetUris_: The target URIs that should receive the headers (Default: All)
