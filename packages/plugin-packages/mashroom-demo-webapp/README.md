
# Mashroom Demo Webapp

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This a simple demo Express webapp which can be developed and run standalone, but also be integrated into _Mashroom Server_
on an arbitrary (configurable) path.

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
