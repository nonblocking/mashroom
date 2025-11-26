
# Mashroom Add User Header Http Proxy Interceptor

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

If you add this plugin it will add HTTP headers with user information to all proxy backend calls. By default, it adds:

 * X-USER-NAME
 * X-USER-DISPLAY-NAME
 * X-USER-EMAIL

## Usage

If *node_modules/@mashroom* is configured as a plugin path, add **@mashroom/mashroom-http-proxy-add-user-headers** as *dependency*.

You can override the default config in your server config file like this:

```json
{
  "plugins": {
        "Mashroom Http Proxy Add User Headers Interceptor": {
            "userNameHeader": "X-USER-NAME",
            "displayNameHeader": "X-USER-DISPLAY-NAME",
            "emailHeader": "X-USER-EMAIL",
            "extraDataHeaders": {},
            "targetUris": [".*"]
        }
    }
}
```

 * _userNameHeader_: The HTTP header for the username (Default: X-USER-NAME)
 * _displayNameHeader_: The HTTP header for the display name (Default: X-USER-DISPLAY-NAME)
 * _emailHeader_: The HTTP header for the email address (Default: X-USER-EMAIL)
 * _extraDataHeaders_: A mapping of *user.extraData* properties to headers (Default: {})
 * _targetUris_: A list of regular expressions that match URIs that should receive the headers (Default: [.*])
