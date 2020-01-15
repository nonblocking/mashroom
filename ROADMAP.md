
# Mashroom Roadmap

## Version 1.3

 * OpenId Connect (OAuth) security provider
 * mongoDB storage provider

## Version 1.4

 * Portal: Add better support for chunks/code-splitting by setting the webpack publicPath dynamically during loading
 * Portal: Default theme: Language switcher
 * CMS content rendering app with a pluggable backend connector (e.g. for a headless CMS or Typo 3)
 * Asset rendering app with a pluggable backend connector (e.g. for a DMS or S3)

## Version 1.5

 * WebSocket proxy similar to mashroom-http-proxy based on mashroom-websocket
 * Use the new WebSocket proxy to handle restProxy targetUri's beginning with ws://
 * STOMP external messaging provider (to connect to ActiveMQ, RabbitMQ, HornetQ and so on)

## Post 1.5

 * Portal: Responsive Admin App
 * Core: Handle path collisions of express apps
 * Core: Add possibility to map sites to virtual hosts
 * Security Plugin: Add IP based ACL rules
 * App store

