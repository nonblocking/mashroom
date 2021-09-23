
# Mashroom Portal Sandbox App

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

When you place this Portal App on an empty page it allows sandbox testing of any other App.
This means you can load any other portal app with a specific configuration and you can interact with it via Message Bus.
You can also pass the desired Portal App and configuration via query parameter which is useful for end-2-end testing with tools such as _Selenium_.

## Usage

 * If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-portal-sandbox-app** as *dependency*.
 * Add the _Mashroom Sandbox App_ app on an empty page
 * Select the app you want to run within the sandbox

The app checks the following query parameters:

 * *sbPreselectAppName*: The name of the app that should be preselected (without starting it)
 * *sbAppName*: The name of the app that should be started in the sandbox.
   If this parameter is given the app will be started automatically, otherwise all other query parameters are ignored.
 * *sbWidth*: The width the app should be started with. Default: 100%
 * *sbLang*: The language code that should be passed to the app.
 * *sbPermissions*: The base64 encoded _permissions_ object that should be passed to the app. E.g.:
 ```
btoa(JSON.stringify({
    permissionA: true
}))
```
 * *sbAppConfig*: The Base64 encoded _appConfig_ object that should be passed to the app.

For an example how to use the sandbox in an end-2-end test see:
https://github.com/nonblocking/mashroom-portal-quickstart/tree/master/plugin-packages/example-react-app/test-e2e/example.test.js
