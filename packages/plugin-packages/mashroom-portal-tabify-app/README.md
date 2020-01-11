
### Mashroom Portal Tabify App

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

Adds a portal app that turns the app area it is placed in automatically into a tabbed container.

#### Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-portal-tabify-app** as *dependency*.

After placing it on a page use the Portal Admin Toolbar to set the following properties:

 * _addCloseButtons_: Defines if a close button will be added to remove a portal app displayed as tab
 * _appNameTitleMapping_: A map to override the displayed title in the tab (Portal App Name -> Title to display)

**Updates via MessageBus**

It is possible to change the App/Title mapping and to show a specific Tab via _MessageBus_. This is especially
useful for dynamic cockpits where you load Apps programmatically via _MashroomPortalAppService_.

Available topics:

 * tabify-add-plugin-name-title-mapping
 * tabify-add-app-id-title-mapping
 * tabify-focus-app


_tabify-add-plugin-name-title-mapping_ expect a message like this:

```
{
    pluginName: 'My App',
    title: 'Another title'
}
```

_tabify-add-app-id-title-mapping_ expect a message like this:

```
{
    appId: '1234123',
    title: 'Another title'
}
```

And _tabify-focus-app_ expects just an id:

```
{
    appId: '1234123'
}
```


