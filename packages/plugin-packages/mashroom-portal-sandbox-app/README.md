
### Mashroom Portal Sandbox App

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**. 

When you place this portal app on an empty page it allows sandbox testing of any other app.
This means you can load any other portal app with a specific configuration and you can interact with it via Message Bus. 
You can also pass the desired portal app and configuration via query parameter which is useful for end-2-end testing with tools such as _Selenium_.

#### Usage

* If *node_modules/@mashroom* is configured as plugin path just add this package as _dependency_.
* Add the _Mashroom Sandbox App_ app on an empty page
* Select the app you want to run within the sandbox

The app checks the following query parameters:

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