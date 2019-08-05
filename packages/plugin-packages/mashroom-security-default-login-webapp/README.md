
### Mashroom Security Default Login Webapp

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**. 

This plugin adds a login webapp that can be used for security provides that require a login page.

#### Usage

If _node_modules/@mashroom_ is configured as plugin path just add this package as _dependency_.

You can override the default config in your Mashroom config file like this:

```json
{
  "plugins": {
        "Mashroom Security Default Login Webapp": {
            "path": "/my-login-page"
        }
    }
}
```

 * _path_: The path of the login page (Default: /login)
