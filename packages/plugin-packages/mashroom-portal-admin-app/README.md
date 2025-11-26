
# Mashroom Portal Admin App

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin contains the default Admin Toolbar for the [Mashroom Portal](../mashroom-portal).

## Usage

If *node_modules/@mashroom* is configured as a plugin path, add **@mashroom/mashroom-portal-admin-app** as *dependency*.

To enable it, add the following to the server config:

```json
{
  "plugins": {
        "Mashroom Portal WebApp": {
            "adminApp": "Mashroom Portal Admin App"
        }
    }
}
```
