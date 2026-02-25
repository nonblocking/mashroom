
# Mashroom Portal Tailwind Theme

A [Tailwind 4](https://tailwindcss.com/) based Portal Theme.

It exposes a (static) *theme* and the *base* layer.

It also uses [tailwind-bootstrap-grid](https://github.com/karolis-sh/tailwind-bootstrap-grid) to provide a *Bootstrap 5* compatible grid,
necessary for the default layouts to work.

*Microfrontends* should import the *theme.css* of this Theme like this:

```css
/* Wrap the generated utilities, so they are only applied to this App */
#some-wrapper {
    @tailwind utilities;
}

/* Do NOT @import theme.css, it is provided by the Portal theme */
@reference "@mashroom/mashroom-portal-tailwind-theme/theme.css";
```

The theme uses [Handlebars](https://handlebarsjs.com) as a template engine and comes with a dark mode.

## Usage

If *node_modules/@mashroom* is configured as a plugin path, add **@mashroom/mashroom-portal-tailwind-theme** as *dependency*.

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
And then start by tweaking the Tailwind theme in *src/frontend/style/theme.css*.

Structure of the theme plugin:

 * backend
   * mashroom-bootstrap.ts → the plugin implementation
   * handlebar-helper.js → functions that can be used in the templates
   * dev-server.ts → just a server to run the theme standalone during development
 * frontend
   * js
     * main.ts → helper functions and the logic to replace the page content (SPA mode)
   * style
     * admin.css → the style for the Admin Toolbar
     * apps.css → style overrides for specific Portal Apps
     * base.css → style for base elements such as headers (without Tailwind classes)
     * components.css → styles for common ui components used by the Admin toolbar and other Apps shipped with Mashroom
     * layout.css → the page layout
     * portal.css → the style for Portal pages
     * theme.css → the Tailwind theme
 * views
   * appError.handlebars → template for Portal App (loading) errors
   * appWrapper.handlebars → template for the Portal App wrapper
   * portal.handlebars → the actual page template
