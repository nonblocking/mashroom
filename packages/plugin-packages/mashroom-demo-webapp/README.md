
# Mashroom Demo Webapp

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

Contains a demo Express web-app plugin.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-demo-webapp** as *dependency*.

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
