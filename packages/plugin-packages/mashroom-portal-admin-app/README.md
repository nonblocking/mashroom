
### Mashroom Portal Admin App

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**. 

Adds the default Admin UI for the _Mashroom Portal_.

#### Usage

If _node_modules/@mashroom_ is configured as plugin path just add this package as _dependency_.

To enable it add the following to the _Mashroom Portal_ config:

```json
{
  "plugins": {
        "Plugin: Mashroom Portal WebApp": {
            "adminApp": "Mashroom Portal Admin App"
        }
    }
}
```
