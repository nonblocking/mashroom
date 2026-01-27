
# Mashroom Portal Bootstrap Theme

A [Bootstrap 5](https://getbootstrap.com/) based Portal Theme.

It exposes the full Bootstrap CSS, so you can use in your Microfrontends (Portal Apps):

 * All Bootstrap variables, like *--bs-primary*
 * All Bootstrap CSS classes, like *col-sm* and *btn-primary*
 * Any UI framework that uses Bootstrap, like [react-bootstrap](https://react-bootstrap.netlify.app) or [bootstrap-vue-next](https://bootstrap-vue-next.github.io/bootstrap-vue-next).
   Check out [mashroom-portal-demo-react-bootstrap-app](../mashroom-portal-demo-react-bootstrap-app) for an example.

The theme uses [Handlebars](https://handlebarsjs.com) as a template engine and comes with a dark mode.

## Usage

If *node_modules/@mashroom* is configured as a plugin path, add **@mashroom/mashroom-portal-bootstrap-theme** as *dependency*.

You can override the default config in your server config file like this:

```json
{
    "plugins": {
        "Mashroom Portal Default Theme": {
            "spaMode": true,
            "darkMode": "auto",
            "styleFile": null,
            "logoImageUrl": null,
            "showPortalAppHeaders": true,
            "showEnvAndVersions": true
        }
    }
}
```

* _spaMode_: The theme will try to operate like an SPA and loads new page content via fetch and replaces the DOM.
  This only works until the user does not navigate on a page with a different theme or different page enhancements,
  in that case a full page load is triggered (Default: true)
* _darkMode_: Possible values: *true*, *false*, *"auto"* (Default: "auto")
* _styleFile_: Custom CSS that can be used to overwrite CSS variables and to customize the theme (relative to the server config file, default: null)
* _logoImageUrl_: Optional logo image URL (Default: null)
* _showPortalAppHeaders_: Show or hide Portal App headers (Default: true)
* _showEnvAndVersions_: Show the environment (_NODE_ENV_) and version information in the header (Default: false)

## Customizing

The easiest way to customize this theme is to copy it and to change its name in *mashroom.json*.
And then start by tweaking the variables in *src/frontend/sass/_variables.scss*.

Structure of the theme plugin:

 * backend
   * mashroom-bootstrap.ts → the plugin implementation
   * handlebar-helper.js → functions that can be used in the templates
   * dev-server.ts → just a server to run the theme standalone during development
 * frontend
   * js
     * main.ts → helper functions and the logic to replace the page content (SPA mode)
   * sass
     * _apps.scss → style overrides for specific Portal Apps
     * _base.scss → style for base elements such as headers
     * _components.scss → styles for common ui components use by the Admin toolbar and other Apps shipped with Mashroom
     * _layout.scss → the page layout
     * _variables.scss → Bootstrap and theme variables
     * admin.scss → the style for the Admin Toolbar
     * portal.scss → the style for Portal pages
 * views
   * appError.handlebars → template for Portal App (loading) errors
   * appWrapper.handlebars → template for the Portal App wrapper
   * portal.handlebars → the actual page template
