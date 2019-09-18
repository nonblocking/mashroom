
# Mashroom Roadmap

## Version 1.1

### Core

### Portal

 * Declaration and loading of global (shared) portal app resources 
 * Use the new WebSocket proxy to handle restProxy targetUri's beginning with ws://
 * Admin Portal App
    * Responsive design

### Plugins
 
 * Redis Session provider
 * MongoDb storage implementation
 * WebSocket proxy similar to mashroom-http-proxy based on mashroom-websocket
 * OAuth2 security provider


## Version 1.2

### Core

 * Handle path collisions of express apps
 * Vhost middleware

### Portal

 * CMS content rendering app with a pluggable backend connector (e.g. for a headless CMS or Typo 3)
 * Asset rendering app with a pluggable backend connector (e.g. for a DMS or S3)
 * Language switcher (available languages)

### Plugins

 * Security: Add IP based ACL rules
 * Support for vhosts (map a site to a virtual host)


## Later

### Core

 * Add TypeScript types
 * App store
 

