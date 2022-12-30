
# Mashroom Security Default Login Webapp

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin adds a default login webapp which can be used for security providers that require a login page.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-security-default-login-webapp** as *dependency*.

You can override the default config in your Mashroom config file like this:

```json
{
  "plugins": {
        "Mashroom Security Default Login Webapp": {
            "path": "/login",
            "pageTitle": "My fancy website",
            "loginFormTitle": "Login",
            "styleFile": "./login_style.css"
        }
    }
}
```

 * _path_: The path of the login page (Default: /login)
 * _pageTitle_: A custom page title, can be the actual title or a message key (i18n) (Default is the server name)
 * _loginFormTitle_: A custom title for the login form, can be the actual title or a message key (i18n) (Default: _login_)
 * _styleFile_: Custom CSS that will be loaded instead of the built-in style (relative to Mashroom config file, default: null)
