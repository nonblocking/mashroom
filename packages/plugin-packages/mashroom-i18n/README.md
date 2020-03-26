
# Mashroom I18N

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

Adds a service for internationalization. It determines the language from the HTTP headers and
supports translation of messages.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-i18n** as *dependency*.

After that you can use the service like this:

```js
// @flow

import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';

export default (req: ExpressRequest, res: ExpressResponse) => {
    const i18nService: MashroomI18NService = req.pluginContext.services.i18n.service;

    const currentLang = i18nService.getLanguage(req);
    const message =  i18nService.getMessage('username', 'de');
    // message will be 'Benutzernamen'

    // ...
}
```

You can override the default config in your Mashroom config file like this:

```json
{
    "plugins": {
        "Mashroom Internationalization Services": {
            "availableLanguages": ["en", "de", "fr"],
            "defaultLanguage": "en",
            "messages": "./messages"
        }
    }
}
```

 * _availableLanguages_: A list of available languages (Default: ["en"])
 * _defaultLanguage_: The default language if it can not be determined from the request (Default: en)
 * _messages_: The folder with custom i18n messages (Default: ./messages). There are default messages
   in the messages folder of this package.

The lookup for message files works like this:

 * &lt;messages_folder&gt;/messages.&lt;lang&gt;.json
 * &lt;built_in_messages_folder&gt;/messages.&lt;lang&gt;.json
 * &lt;messages_folder&gt;/messages.json
 * &lt;built_in_messages_folder&gt;/messages.json

And a messages file (e.g. _messages.de.json_) looks like this:

```json
{
    "message_key": "Die Nachricht"
}
```

## Services

### MashroomI18NService

The exposed service is accessible through _pluginContext.services.i18n.service_

**Interface:**

```js
export interface MashroomI18NService {
    /**
     * Get the currently set language (for current session)
     */
    getLanguage(req: ExpressRequest): string;
    /**
     * Set session language
     */
    setLanguage(language: string, req: ExpressRequest): void;
    /**
     * Get the message for given key and language
     */
    getMessage(key: string, language: string): string;
    /**
     * Get plain string in the current users language from a I18NString
     */
    translate(req: ExpressRequest, str: I18NString): string;
    /**
     * Get available languages
     */
    +availableLanguages: Array<string>;
    /**
     * Get the default languages
     */
    +defaultLanguage: string;
}
```
