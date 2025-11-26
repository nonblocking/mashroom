
# Mashroom Demo Webapp

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This is a simple demo Express webapp that can be developed and run standalone but also be integrated into _Mashroom Server_
on an arbitrary (configurable) path.

## Usage

If *node_modules/@mashroom* is configured as a plugin path, add **@mashroom/mashroom-demo-webapp** as *dependency*.

After that the webapp will be available at _/demo/webapp_

You can change the path by overriding it in your server config file like this:

```json
{
  "plugins": {
        "Mashroom Demo Webapp": {
            "path": '/my/path'
        }
    }
}
```
