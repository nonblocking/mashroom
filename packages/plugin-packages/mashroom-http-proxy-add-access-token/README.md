
# Mashroom Add Access Token Http Proxy Interceptor

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

If you add this plugin it will add the access token from the OpenId Connect plugin to every backend call.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-csrf-protection** as *dependency*.

You can override the default config in your Mashroom config file like this:

```json
{
  "plugins": {
        "Mashroom Http Proxy Add Access Token Interceptor": {
            "addBearer": false,
            "accessTokenHeader": "X-USER-ACCESS-TOKEN",
            "targetUris": [".*"]
        }
    }
}
```

 * _addBearer_: Add the token as authorization bearer header (Default: true)
 * _accessTokenHeader_: The HTTP header for the access token - has no effect if _addBearer_ is true (Default: X-USER-ACCESS-TOKEN)
 * _targetUris_: A list of regular expressions that match URIs that should receive the headers (Default: [.*])
