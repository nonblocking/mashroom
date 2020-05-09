
# Mashroom Roadmap

## Version 1.5

 * Add a memory cache plugin with multiple providers (memory, Redis)
 * Use the memory cache in mashroom-storage if available
 * Add a plugin that exposes Prometheus metrics

## Version 1.6

 * Security: Add a "brokering" security provider that dispatches the actual authentication to different security providers
   based on some rules (path, query, header). This would for example allow it to have Portal *Sites* with different
   authentication methods (e.g. different Realms).
 * Portal: Add a plugin to display CMS content. It must be possible to plug any CMS that is either headless
   or provides an API to fetch content.

## Version 1.7

 * Add a middleware that allows it to define proper error pages based on response codes (HTML page or external page)
 * Portal: Add better support for chunks/code-splitting by setting the webpack publicPath dynamically during App loading
 * Core: Add a WebSocket proxy similar to *mashroom-http-proxy* (or extend the existing plugin)
 * Portal: Allow Apps to open WebSocket connections to a backend (through the Portal's REST proxy)

## Post 1.7

 * Security: Extend the OIDC provider to allow pass a Bearer token preemptively with a request,
   so external systems can access APIs in Mashroom via an existing token obtained from the same identity provider.
 * Security: Extend the OIDC provider to optionally support the OAuth 2.0 Exchange Token protocol when accessing backend APIs
   (e.g. the BFF of Portal apps). The provider should transparently use the protocol to request access tokens for APIs
   when configured for a base URI.
 * Portal: Add a *Store* that allows it to browse all registered Apps with description, configuration details and screenshots
 * Core: Handle path collisions of express apps
 * Portal Admin App: Make responsive
 * Portal Default theme: Add a language switcher
