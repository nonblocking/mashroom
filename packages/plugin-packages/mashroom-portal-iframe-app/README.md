
### Mashroom Portal iFrame App

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

Adds a (responsive) iFrame portal app to the _Mashroom Portal_.

#### Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-portal-iframe-app** as *dependency*.

After placing it on a page use the Portal Admin Toolbar to set the following properties:

 * _url_: The URL of the page to show in the iframe
 * _width_: The iframe width (Default 100%)
 * _defaultHeight_: The height to use if the embedded page doesn't post the actual required height

To make the iFrame responsive, the embedded page has to post its
height via message like so:

```
var lastContentHeight = null;

function sendHeight() {
    var contentHeight = document.getElementById('content-wrapper').offsetHeight;
    if (lastContentHeight !== contentHeight) {
        parent.postMessage({
            height: contentHeight + /* margin */ 20
        }, "*");
        lastContentHeight = contentHeight;
    }
}

setInterval(sendHeight, 1000);
```

