
# Mashroom Security Default Login Webapp

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

This plugin adds a login webapp that can be used for security provides that require a login page.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-security-default-login-webapp** as *dependency*.

You can override the default config in your Mashroom config file like this:

```json
{
  "plugins": {
        "Mashroom Security Default Login Webapp": {
            "path": "/my-login-page",
            "loginFormTitle": "Login",
            "styleFile": "./login_style.css"
        }
    }
}
```

 * _path_: The path of the login page (Default: /login)
 * _loginFormTitle_: A custom title for the login form (Default is the server name)
 * _styleFile_: Custom CSS that will be loaded instead of the built-in style (relative to Mashroom config file, default: null)
