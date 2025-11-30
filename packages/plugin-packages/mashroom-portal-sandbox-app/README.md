
# Mashroom Portal Sandbox App

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This [Mashroom Portal](../mashroom-portal) App can be used to load and **test any Microfrontend/Portal App** with a specific configuration and to interact with the App via Message Bus.
It can also be used for end-2-end testing with tools such as Selenium.

## Usage

 * If *node_modules/@mashroom* is configured as a plugin path, add **@mashroom/mashroom-portal-sandbox-app** as *dependency*
 * Add the _Mashroom Sandbox App_ on an empty page
 * Select the app you want to run within the sandbox

The app supports the following query parameters:

 * *sbAutoTest*: This is an automated test and all JSON inputs should be replaced by simple textareas
 * *sbPreselectAppName*: The name of the app that should be preselected (without starting it)
 * *sbAppName*: The name of the App that should be started in the sandbox.
   If this parameter is given, the App will be started automatically; otherwise, all other query parameters are ignored.
 * *sbWidth*: The width the App should be started with. Default: 100%
 * *sbLang*: The language code that should be passed to the App.
 * *sbPermissions*: The base64 encoded _permissions_ object that should be passed to the app. E.g.:
 ```
btoa(JSON.stringify({
    permissionA: true
}))
```
 * *sbAppConfig*: The Base64 encoded _appConfig_ object that should be passed to the app.

For an example, how to use the sandbox in an end-2-end test see:
[https://github.com/nonblocking/mashroom-portal-quickstart/tree/master/plugin-packages/example-react-app/test-e2e/example.test.js](https://github.com/nonblocking/mashroom-portal-quickstart/tree/master/plugin-packages/example-react-app/test-e2e/example.test.js)
