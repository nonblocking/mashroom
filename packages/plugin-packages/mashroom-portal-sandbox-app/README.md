
# Mashroom Portal Sandbox App

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

This _Mashroom Portal_ App can be used to load any other Portal App with a specific configuration and to interact with the App via Message Bus.
It can also be used for end-2-end testing with tools such as Selenium.

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
