
# Change Log

## 1.1.2

 * Upgraded some dependencies because of security vulnerabilities

## 1.1.1

 * WebSocket server now sends keep alive messages to prevent reverse proxies and firewalls from closing the connection
 * Portal: _MashroomMessageBus.getRemoteUserPrivateTopic()_ takes now an optional argument _username_ if you want to obtain the private 
   topic of a particular user instead of the "own" (the private topic of the authenticated user)

## 1.1.0

 * Portal: Added two new (optional) security related properties to the default config of portal apps:
     * _defaultRestrictViewToRoles_: Same as the previous _defaultRestrictedToRoles_ but renamed to make its purpose clearer. 
       These roles can be overwritten via Admin App per App instance in the UI.
     * _restProxy.restrictToRoles_: If this is set only users with one of the given roles can access the rest proxy.
       In contrast to all other permissions the _Administrator_ role has _not_ automatically access.
 * Added a provider plugin to support MQTT as external messaging system
 * Added a demo portal app to demonstrate remote messaging
 * Portal: Added support for remote messaging. Portal apps can now subscribe to server side topics (prefixed with :remote) 
   and communicate with apps on other pages and browser tabs. If the service side messaging is connected to an external 
   messaging system (e.g. MQTT) it is also possible to subscribe and publish messages to the external system.
 * Added a Service plugin for server-side messaging that comes with a WebSocket interface which allows sending messages
   across clients (and browser tabs). Furthermore it be connected to an external messaging system (such as MQTT) via provider plugin.
 * Core: Added the possibility to listen on Plugin load and unload events via _MashroomPluginService_.
   Useful if you want to cleanup when your plugin unloads or in the rare case where you have to hold
   a plugin instance and want to get notified about an unload or reload.
 * Added a Service plugin to handle WebSocket connections (_mashroom-websocket_)
 * Core: web-app Plugins can now additionally have handlers for upgrade requests (WebSocket support) and for unload
 * Core: The _Middleware_ tab in the admin UI shows now the actual order of the stack (until now the order was just calculated) 

## 1.0.94

 * Portal: Made it configurable when the Portal will start to warn that the authentication is about to expire
 * Renamed _MashroomSecurityProvider.refreshAuthentication()_ to _checkAuthentication()_ 

## 1.0.93

 * Portal: Added configuration property to automatically extend the authentication (so it stays valid as long as the browser page is opened)
 * Portal: Removed the "auto-logout" feature, instead the Portal warns now when the authentication is about to expire.
 * Decoupled authentication from session, in particular the authentication expiration. This simplifies the implementation for
   providers like OAuth2. **BREAKING CHANGE**: The _MashroomSecurityProvider_ interface has been extended.

## 1.0.92

 * Portal: The app filter in Admin UI considers now _tags_ also. 
   And the categories are sorted alphabetically now.
 * Portal: All initial query parameters are now added again after login

## 1.0.91

 * Core: Added optional _tags_ (array) property to the plugin definition 
 * Bunch of small default theme improvements
 * Common UI library: Highlight input fields with validation errors
 * Portal: Added a Sandbox App to test Portal Apps. 
   It allows it to load any Portal App with a specific configuration and to interact with the App
   via Message Bus. Can also be used for end-2-end testing with tools such as Selenium.

## 1.0.90

First public release
