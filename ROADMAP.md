
# Mashroom Roadmap

## Version 1.4

 * OpenId Connect (OAuth) security provider
 * mongoDB storage provider
 * Portal: Show an error in the Admin Toolbar when a path/url already exists (site, page)

## Version 1.5

 * Portal: Add better support for chunks/code-splitting by setting the webpack publicPath dynamically during loading
 * Portal: Default theme: Language switcher
 * CMS content rendering app with a pluggable backend connector (e.g. for a headless CMS or Typo 3)
 * Asset rendering app with a pluggable backend connector (e.g. for a DMS or S3)

## Version 1.6

 * WebSocket proxy similar to mashroom-http-proxy based on mashroom-websocket
 * Use the new WebSocket proxy to handle restProxy targetUri's beginning with ws://

## Post 1.6

 * Portal: Responsive Admin Toolbar
 * Core: Handle path collisions of express apps
 * Core: Add possibility to map sites to virtual hosts
 * Security Plugin: Add IP based ACL rules
 * App store
