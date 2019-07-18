
### Mashroom Demo Webapp

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**. 

Contains a demo Express web-app plugin.

#### Usage

If _node_modules/@mashroom_ is configured as plugin path just add this package as _dependency_.

After that the webapp will be available at _/demo/webapp_

You can change the path by overriding it in your Mashroom config file like this:

```json
{
  "plugins": {
        "Mashroom Demo Webapp": {
            "path": '/my/path'
        }
    }
}
```
