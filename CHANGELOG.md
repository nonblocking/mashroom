
# Change Log

## 1.0.93

 * Portal: Added configuration property to automatically extend the authentication (so it stays valid as long as the browser page is opened)
 * Portal: Removed the "auto-logout" feature, instead the Portal warns now when the authentication is about to expire.
 * Decoupled authentication from session, in particular the authentication expiration. This simplifies the implementation for
   providers like OAuth2. **BREAKING CHANGE**: The _MashroomSecurityProvider_ has been extended.

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
