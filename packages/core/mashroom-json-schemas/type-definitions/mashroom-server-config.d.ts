/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * This interface was referenced by `undefined`'s JSON-Schema definition
 * via the `patternProperty` ".*".
 */
export type PackagerRelativeOrSystemPathOrHttp = string;
export type PackagerRelativeOrSystemPath = string;

export interface MashroomServerConfig {
  /**
   * The server name
   */
  name?: string;
  port?: number;
  /**
   * Additionally launch a HTTPS server on this port. Requires also tlsOptions to be set (Default: null)
   */
  httpsPort?: number | null;
  /**
   * TLS options if you want to enable HTTPS. The options are passed to https://nodejs.org/api/tls.html but the file paths (e.g. for "cert") are resolved relatively to the server config
   */
  tlsOptions?: {
    [k: string]: any;
  } | null;
  /**
   * Enable HTTP/2 for the HTTPS server. If you enable this WebSockets will no longer work (Default: false)
   */
  enableHttp2?: boolean;
  /**
   * The start page
   */
  indexPage?: string;
  /**
   * The x-powered-by to send; null disables the header
   */
  xPowerByHeader?: string;
  /**
   * The tmp folder for plugin builds and so on
   */
  tmpFolder?: string;
  /**
   * Possible external config file names for plugin packages (Default ["mashroom"])
   */
  externalPluginConfigFileNames?: string[];
  /**
   * The plugin packages
   */
  pluginPackageFolders: PluginPackageFolder[];
  /**
   * Optional timeout for npm execution in dev mode (default 180)
   */
  devModeNpmExecutionTimeoutSec?: number;
  /**
   * An array of plugin names which shall be ignored
   */
  ignorePlugins?: string[];
  plugins?: Plugins;
  $schema?: any;
}
export interface PluginPackageFolder {
  /**
   * The plugin folder path, relative to this file
   */
  path: string;
  /**
   * Watch the plugin folder for changes
   */
  watch?: boolean;
  /**
   * Rebuild plugins after changes and before reloading it (enables watch automatically)
   */
  devMode?: boolean;
  [k: string]: any;
}
/**
 * Plugin specific config
 */
export interface Plugins {
  "Mashroom Browser Cache Services"?: {
    /**
     * Max age in seconds (default: 31536000 (30d))
     */
    maxAgeSec?: number;
    /**
     * Disable browser caching completely (default: false)
     */
    disabled?: boolean;
  };
  "Mashroom CSRF Services"?: {
    /**
     * Passed to the https://www.npmjs.com/package/csrf package
     */
    saltLength?: number;
    /**
     * Passed to the https://www.npmjs.com/package/csrf package
     */
    secretLength?: number;
  };
  "Mashroom CSRF Middleware"?: {
    /**
     * List of HTTP methods that require no CSRF token check (Default: ["GET", "HEAD", "OPTIONS"])
     */
    safeMethods?: string[];
    [k: string]: any;
  };
  "Mashroom Error Pages Middleware"?: {
    /**
     * Maps status codes to error pages.
     * The target files can be file paths or HTTP/S urls.
     * If the file path is not absolute the plugin will expect it to be relative to the plugin folder or the Mashroom server config file.
     */
    mapping?: {
      [k: string]: PackagerRelativeOrSystemPathOrHttp;
    };
    [k: string]: any;
  };
  "Mashroom Helmet Middleware"?: {
    /**
     * The configuration will directly be passed to Helmet - checkout https://helmetjs.github.io/docs
     */
    helmet?: {
      [k: string]: any;
    };
    [k: string]: any;
  };
  "Mashroom Http Proxy Services"?: {
    /**
     * The HTTP methods that should be forwarded
     */
    forwardMethods?: string[];
    /**
     * The HTTP headers that should be forwarded. May contain a _*_ as wildcard
     */
    forwardHeaders?: string[];
    /**
     * Reject self-signed certificates (Default: true)
     */
    rejectUnauthorized?: boolean;
    /**
     * Max sockets per host (Default: 10)
     */
    poolMaxSockets?: number;
    /**
     * Socket timeout, 0 means no timeout (Default: 30000 - 30sec)
     */
    socketTimeoutMs?: number;
    /**
     * Enable/disable connection keep-alive (Default: true)
     */
    keepAlive?: boolean;
    /**
     * If the target resets the connection (because a keep-alive connection is broken) retry once (Default: true)
     */
    retryOnReset?: boolean;
    /**
     * Switch the proxy implementation. Currently available are  'nodeHttpProxy' (based on https://github.com/http-party/node-http-proxy), which is the default, or 'request' (based https://github.com/request/request)
     */
    proxyImpl?: "default" | "nodeHttpProxy" | "request";
  };
  "Mashroom Http Proxy Add User Headers Interceptor"?: {
    /**
     * The HTTP header for the username (Default: X-USER-NAME)
     */
    userNameHeader?: string;
    /**
     * The HTTP header for the display name (Default: X-USER-DISPLAY-NAME)
     */
    displayNameHeader?: string;
    /**
     * The HTTP header for the email address (Default: X-USER-EMAIL)
     */
    emailHeader?: string;
    /**
     * A mapping of *user.extraData* properties to headers (Default: {})
     */
    extraDataHeaders?: {
      [k: string]: any;
    };
    /**
     * A list of regular expressions that match URIs that should receive the headers (Default: [.*])
     */
    targetUris?: string[];
    [k: string]: any;
  };
  "Mashroom Http Proxy Add Access Token Interceptor"?: {
    /**
     * Add the access token as authorization bearer header (Default: true)
     */
    addBearer?: boolean;
    /**
     * The HTTP header for the access token - has no effect if _addBearer_ is true (Default: X-USER-ACCESS-TOKEN)
     */
    idTokenHeader?: string;
    /**
     * A list of regular expressions that match URIs that should receive the headers (Default: [.*])
     */
    targetUris?: string[];
    [k: string]: any;
  };
  "Mashroom Internationalization Services"?: {
    /**
     * A list of available languages (Default: ["en"])
     */
    availableLanguages?: string[];
    /**
     * The default language if it can not be determined from the request (Default: en)
     */
    defaultLanguage?: string;
    /**
     * The folder with custom i18n messages (Default: ./messages)
     */
    messages?: string;
  };
  "Mashroom Memory Cache Services"?: {
    /**
     * The name of the provider. Default is 'local' which uses the local Node.js memory
     */
    provider?: string;
    /**
     * The default TTL in seconds (Default: 300)
     */
    defaultTTLSec?: number;
  };
  "Mashroom Memory Cache Redis Provider"?: IORedisConfig;
  "Mashroom Messaging Services"?: {
    /**
     * A plugin that connects to an external messaging system. Allows to receive messages from other systems and to send messages "out" (Default: null)
     */
    externalProvider?: string | null;
    /**
     * A list of topic roots that should be considered as external.
     * E.g. if the list contains _other-system_ topics published to _other-system/foo_ or _other-system/bar_ would be send via _externalProvider_. (Default: [])
     */
    externalTopics?: string[];
    /**
     * The base for private user topics.
     * If the prefix is _something/user_ the user _john_ would only be able to subscribe to _user/john/something_ and not to _something/user/thomas/weather-update_ (Default: user)
     */
    userPrivateBaseTopic?: string;
    /**
     * Enable WebSocket support when mashroom-websocket is present (Default: true)
     */
    enableWebSockets?: boolean;
    /**
     * Access control list to restrict the use of certain topic patterns to specific roles (Default: ./topicACL.json)
     */
    topicACL?: string;
  };
  "Mashroom Messaging External Provider AMQP"?: {
    /**
     *  The base routing key the server should use for internal messages.
     * E.g. if the value is mashroom.test all messages published internally are prefixed with *mashroom.test* before published to the broker and at the same time this provider listens to mashroom.test.# for messages (Default: mashroom)
     */
    internalRoutingKey?: string;
    /**
     * The prefix for the topic exchange (default: /topic/ (RabbitMQ))
     */
    brokerTopicExchangePrefix?: string;
    /**
     * The wildcard for match any words (default: # (RabbitMQ))
     */
    brokerTopicMatchAny?: string;
    /**
     * AMQP broker host (Default: localhost)
     */
    brokerHost?: string;
    /**
     * AMQP broker port (Default: 5672)
     */
    brokerPort?: number;
    /**
     * AMQP broker username (optional)
     */
    brokerUsername?: string;
    /**
     * AMQP broker password (optional)
     */
    brokerPassword?: string;
  };
  "Mashroom Messaging External Provider MQTT"?: {
    /**
     * The base topic the server should use for internal messages.
     * E.g. if the value is mashroom/test all messages published internally are prefixed with mashroom/test before published to MQTT and at the same time this provider listens to mashroom/test/# for messages (Default: mashroom)
     */
    internalTopic?: string;
    /**
     * MQTT connect URL (Default: mqtt://localhost:1883)
     */
    mqttConnectUrl?: string;
    /**
     * MQTT protocol version (Default: 4)
     */
    mqttProtocolVersion?: 3 | 4;
    /**
     * Quality of service level (Default: 1)
     */
    mqttQoS?: 0 | 1 | 2;
    /**
     * Optional MQTT username (Default: null)
     */
    mqttUser?: string;
    /**
     * Optional MQTT password (Default: null)
     */
    mqttPassword?: string;
    /**
     * If you use mqtts or wss with a self signed certificate set it to false (Default: true)
     */
    rejectUnauthorized?: boolean;
  };
  "Mashroom Monitoring Metrics Collector Services"?: {
    /**
     * A list of metrics that should be disabled
     */
    disableMetrics?: string[];
    /**
     * Default buckets for histogram metrics
     */
    defaultHistogramBuckets?: number[];
    /**
     * Override the bucket configuration for histogram metrics
     */
    customHistogramBucketConfig?: {
      /**
       * This interface was referenced by `undefined`'s JSON-Schema definition
       * via the `patternProperty` "^.*$".
       */
      [k: string]: number[];
    };
    /**
     * Default quantiles for summary metrics
     */
    defaultSummaryQuantiles?: number[];
    /**
     * Override the quantiles configuration for summary metrics
     */
    customSummaryQuantileConfig?: {
      /**
       * This interface was referenced by `undefined`'s JSON-Schema definition
       * via the `patternProperty` "^.*$".
       */
      [k: string]: number[];
    };
  };
  "Mashroom Monitoring PM2 Exporter"?: {
    /**
     * Will be passed as metrics to https://github.com/keymetrics/pm2-io-apm/tree/master#configuration
     */
    pmxMetrics?: {
      v8?: boolean;
      runtime?: boolean;
      network?: {
        upload?: boolean;
        download?: boolean;
        [k: string]: any;
      };
      http?: boolean;
      eventLoop?: boolean;
    };
    /**
     * A list of Mashroom plugin metrics that should be exposed
     */
    mashroomMetrics?: string[];
  };
  "Mashroom Monitoring Prometheus Exporter Webapp"?: {
    /**
     * The path where the metrics will be exported (Default: /metrics)
     */
    path?: string;
    /**
     * Enable additional GC stats like 'runs total' and 'pause seconds total' (Default: true)
     */
    enableGcStats?: boolean;
  };
  "Mashroom Portal WebApp"?: {
    /**
     * The portal base path (Default: /portal)
     */
    path?: string;
    /**
     * The admin to use (Default: Mashroom Portal Admin App)
     */
    adminApp?: string | null;
    /**
     * The default theme if none is selected in the site or page configuration (Default: Mashroom Portal Default Theme)
     */
    defaultTheme?: string;
    /**
     * The default layout if none is selected in the site or page configuration (Default: Mashroom Portal Default Layouts 1 Column)
     */
    defaultLayout?: string;
    /**
     * The time when the Portal should start to warn that the authentication is about to expire.
     * A value of 0 or lower than 0 disables the warning. (Default: 60)
     */
    warnBeforeAuthenticationExpiresSec?: number;
    /**
     * Automatically extend the authentication as long as the portal page is open (Default: false)
     */
    autoExtendAuthentication?: boolean;
    /**
     * If an App on a page can't be found just show nothing instead of an error message (Default: false)
     */
    ignoreMissingAppsOnPages?: boolean;
    /**
     * Optional default http proxy config for portal apps
     */
    defaultProxyConfig?: {
      /**
       * Add the header X-USER-PERMISSIONS with a comma separated list of permissions calculated from rolePermissions
       */
      sendPermissionsHeader?: boolean;
      /**
       * Optional list of roles that are permitted to access the proxy
       */
      restrictToRoles?: string[];
    };
    /**
     * Optional config for server side rendering
     */
    ssrConfig?: {
      /**
       * Allow server side rendering if Apps support it (Default: true)
       */
      ssrEnable?: boolean;
      /**
       * Timeout for SSR which defines how long the page rendering can be blocked (Default: 2000)
       */
      renderTimoutMs?: number;
      /**
       * Enable cache for server-side rendered HTML (Default: true)
       */
      cacheEnable?: boolean;
      /**
       * The timeout in seconds for cached SSR HTML (Default: 300)
       */
      cacheTTLSec?: number;
      /**
       * Inline the App's CSS to avoid sudden layout shifts after loading the initial HTML (Default: true)
       */
      inlineStyles?: boolean;
    };
    /**
     * Add some demo pages if the configuration storage is empty (Default: true)
     */
    addDemoPages?: boolean;
  };
  "Mashroom Portal Default Theme"?: {
    /**
     * The theme will try to operate like an SPA and loads new page content via AJAX and replaces the DOM (Default: true)
     */
    spaMode?: boolean;
    /**
     * Show or hide Portal App headers (Default: true)
     */
    showPortalAppHeaders?: boolean;
    /**
     * Show the environment (NODE_ENV) and version information in the header (Default: false)
     */
    showEnvAndVersions?: boolean;
  };
  "Mashroom Portal Remote App Background Job"?: {
    /**
     * The cron schedule for the background job that scans for new apps (Default: every minute)
     */
    cronSchedule?: string;
    /**
     * Socket timeout when trying to reach the remote app (Default: 3)
     */
    socketTimeoutSec?: number;
    /**
     * Interval for refreshing known endpoints (Default: 600)
     */
    registrationRefreshIntervalSec?: number;
  };
  "Mashroom Portal Remote App Registry"?: {
    /**
     * Location of the config file with the remote URLs, relative to the server config (Default: ./remotePortalApps.json)
     */
    remotePortalAppUrls?: string;
    [k: string]: any;
  };
  "Mashroom Portal Remote App Registry Admin Webapp"?: {
    /**
     *  Show the 'Add a new Remote Portal App Endpoint' form in the Admin UI
     */
    showAddRemoteAppForm?: boolean;
    [k: string]: any;
  };
  "Mashroom Portal Remote App Kubernetes Background Job"?: {
    /**
     * The cron schedule for the background job that scans for new apps (Default: every minute)
     */
    cronSchedule?: string;
    /**
     * Label selector(s) for namespaces, can be a single string or an array (e.g. environment=development,tier=frontend) (Default: null)
     */
    k8sNamespacesLabelSelector?: string | string[];
    /**
     * A distinct list of Kubernetes namespaces to scan; can be null if k8sNamespacesLabelSelector is set (Default: ["default"])
     */
    k8sNamespaces?: string[];
    /**
     * Label selector(s) for services, can be a single string or an array (e.g. microfrontend=true) (e.g. microfrontend=true) (Default: null)
     */
    k8sServiceLabelSelector?: string | string[];
    /**
     * A regular expression for services that should be checked (case insensitive). (Default: ".*")
     */
    serviceNameFilter?: string;
    /**
     * Socket timeout when trying to the Kubernetes service (Default: 3)
     */
    socketTimeoutSec?: number;
    /**
     * The time in seconds after that a registered services show be re-checked (Default: 600)
     */
    refreshIntervalSec?: number;
    /**
     * Access services via IP address and not via <name>.<namespace> (Default: false)
     */
    accessViaClusterIP?: boolean;
  };
  "Mashroom Security Services"?: {
    /**
     *  The plugin that actually does the authentication and knows how to retrieve the user roles (Default: Mashroom Security Simple Provider)
     */
    provider?: string;
    /**
     * A list of query parameters that should be forwarded during the authentication.
     * (will be added to the login or authorization URL)
     */
    forwardQueryHintsToProvider?: string[];
    /**
     * The ACL for path based security restrictions (see below) (Default: ./acl.json)
     */
    acl?: string;
  };
  "Mashroom Security Default Login Webapp"?: {
    /**
     * The path of the login page (Default: /login)
     */
    path?: string;
    /**
     * A custom page title, can be the actual title or a message key (i18n) (Default is the server name)
     */
    pageTitle?: string;
    /**
     * A custom title for the login form, can be the actual title or a message key (i18n) (Default: login)
     */
    loginFormTitle?: string;
    /**
     * Custom CSS that will be loaded instead of the built-in style (relative to Mashroom config file, default: null)
     */
    styleFile?: string;
  };
  "Mashroom Basic Wrapper Security Provider"?: {
    /**
     * The actual security provider that is used to login (Default: Mashroom Security Simple Provider)
     */
    targetSecurityProvider?: string;
    /**
     * Only use BASIC if it is sent preemptively if true. Otherwise, the plugin will send HTTP 401 which will trigger the Browser's login popup (Default: true)
     */
    onlyPreemptive?: boolean;
    /**
     * The realm name that should be used if onlyPreemptive is false (Default: mashroom)
     */
    realm?: string;
  };
  "Mashroom LDAP Security Provider"?: {
    /**
     * The login URL to redirect to if the user is not authenticated (Default: /login)
     */
    loginPage?: string;
    /**
     * The LDAP server URL with protocol and port
     */
    serverUrl: string;
    /**
     * Connect timeout in ms (Default: 3000)
     */
    ldapConnectTimeout?: number;
    /**
     * Timeout in ms (Default: 5000)
     */
    ldapTimeout?: number;
    /**
     * TLS options if your LDAP server requires TLS. The options are passed to https://nodejs.org/api/tls.html but the file paths (e.g. for "cert") are resolved relatively to the server config
     */
    tlsOptions?: {
      [k: string]: any;
    } | null;
    /**
     * The bind user for searching
     */
    bindDN: string;
    /**
     * The password for the bind user
     */
    bindCredentials: string;
    /**
     * The base DN for searches (can be empty)
     */
    baseDN: string;
    /**
     * The user search filter, @username@ will be replaced by the actual username entered in the login form
     */
    userSearchFilter?: string;
    /**
     * The group search filter (can be empty if you don't want to fetch the user groups)
     */
    groupSearchFilter?: string;
    /**
     * Optionally map extra LDAP attributes to user.extraData. The key in the map is the extraData property, the value the LDAP attribute (Default: null)
     */
    extraDataMapping?: {
      /**
       * This interface was referenced by `undefined`'s JSON-Schema definition
       * via the `patternProperty` "^.*$".
       */
      [k: string]: string;
    };
    /**
     * Optionally map extra LDAP attributes to user.secrets (Default: null)
     */
    secretsMapping?: {
      /**
       * This interface was referenced by `undefined`'s JSON-Schema definition
       * via the `patternProperty` "^.*$".
       */
      [k: string]: string;
    };
    /**
     * An optional JSON file that contains a user group to roles mapping (Default: /groupToRoleMapping.json)
     */
    groupToRoleMapping?: string;
    /**
     * An optional JSON file that contains a user name to roles mapping (Default: /userToRoleMapping.json)
     */
    userToRoleMapping?: string;
    /**
     *  The inactivity time after that the authentication expires. Since this plugin uses the session to store make sure the session cookie.maxAge is greater than this value (Default: 1200)
     */
    authenticationTimeoutSec?: number;
  };
  "Mashroom OpenID Connect Security Provider"?: {
    /**
     * Can be _OIDC_ (default) or _OAuth2_. Pure OAuth2 usually does not support permission roles (for authorization)
     */
    mode?: "OIDC" | "OAuth2";
    /**
     * The OpenID Connect Discovery URL, this is usually https://<your-idp-host>/.well-known/openid-configuration
     */
    issuerDiscoveryUrl?: string | null;
    /**
     * The issuer metadata if no issuerDiscoveryUrl is available. Will be passed to the issuer constructor: https://github.com/panva/node-openid-client/blob/master/docs/README.md#issuer (Default: null)
     */
    issuerMetadata?: {
      [k: string]: any;
    } | null;
    /**
     * The scope (permissions) to ask for (Default: openid email profile)
     */
    scope?: string;
    /**
     * The client to use (Default: mashroom)
     */
    clientId?: string;
    /**
     * The client secret
     */
    clientSecret: string;
    /**
     * The full URL of the callback (as seen from the user). This is usually https://<mashroom-server-host>/openid-connect-cb
     */
    redirectUrl: string;
    /**
     * The OpenID Connect response type (flow) to use (Default: code)
     */
    responseType?: string;
    /**
     * Use the Proof Key for Code Exchange extension for the code flow (Default: false)
     */
    usePKCE?: boolean;
    /**
     * Extra authentication parameters that should be used
     */
    extraAuthParams?: {
      [k: string]: any;
    };
    /**
     * Optionally map extra claims to _user.extraData_. The key in the map is the extraData property, the value the claim name (Default: null)
     */
    extraDataMapping?: {
      [k: string]: any;
    };
    /**
     * Defines the name of the claim (the property of the claims or userinfo object) that contains the user roles array (Default: roles)
     */
    rolesClaimName?: string;
    /**
     * A list of user roles that should get the Mashroom _Administrator_ role (Default: ["mashroom-admin"])
     */
    adminRoles?: string[];
    /**
     * Reject self-signed certificates when contacting the Authorization Server (Default: true)
     */
    httpRequestRejectUnauthorized?: boolean;
    /**
     * Request timeout when contacting the Authorization Server (Default: 3500)
     */
    httpRequestTimeoutMs?: number;
    /**
     * Number of retries when contacting the Authorization Server (Default: 0)
     */
    httpRequestRetry?: number;
  };
  "Mashroom OpenID Connect Security Provider Callback"?: {
    /**
     * Path of the callback
     */
    path?: string;
  };
  "Mashroom Security Simple Provider"?: {
    /**
     * The path to the JSON file with user and role definitions (Default: ./users.json)
     */
    users?: string;
    /**
     * The path to redirect to if a restricted resource is requested but the user not logged in yet (Default: /login)
     */
    loginPage?: string;
    /**
     * The inactivity time after that the authentication expires. Since this plugin uses the session to store make sure the session cookie.maxAge is greater than this value (Default: 1200)
     */
    authenticationTimeoutSec?: number;
  };
  "Mashroom Session Middleware"?: {
    /**
     * The plugin from type session-store-provider that implements the store (Default: memory)
     */
    provider?: string;
    /**
     * The properties are just passed to express-session. See https://www.npmjs.com/package/express-session for possible options
     */
    session?: {
      [k: string]: any;
    };
  };
  /**
   * The config object will be passed to https://github.com/valery-barysok/session-file-store
   */
  "Mashroom Session Filestore Provider"?: {
    /**
     * The directory where the session files will be stored (Default: ./data/sessions)
     */
    path?: string;
    [k: string]: any;
  };
  /**
   * All config options are passed to the connect-mongodb-session
   */
  "Mashroom Session MongoDB Provider"?: {
    client?: MongoDbConfig;
    /**
     * Mongo collection to store sessions (Default: mashroom-sessions)
     */
    collectionName?: string;
    /**
     * TTL in seconds (Default: 86400 - one day)
     */
    ttl?: number;
    /**
     * Session remove strategy (Default: native)
     */
    autoRemove?: "native" | "interval" | "disabled";
    /**
     * Remove interval in seconds if *autoRemove* is interval (Default: 10)
     */
    autoRemoveInterval?: number;
    /**
     * Interval in seconds between session updates (Default: 0)
     */
    touchAfter?: number;
    /**
     * Options regarding session encryption
     */
    crypto?: {
      [k: string]: any;
    };
  };
  "Mashroom Session Redis Provider"?: {
    client?: IORedisConfig;
    /**
     * The key prefix (Default: mashroom:sess:)
     */
    prefix?: string;
    /**
     * TTL in seconds (Default: 86400 - one day)
     */
    ttl?: number;
  };
  "Mashroom Storage Services"?: {
    /**
     * The storage-provider plugin that implements the actual storage (Default: Mashroom Storage Filestore Provider)
     */
    provider?: string;
    /**
     * Use the memory cache to improve the performance. Requires @mashroom/mashroom-memory-cache to be installed.
     */
    memoryCache?: {
      /**
       * Enable cache (of all) collections. The preferred way is to set this to false and enable caching per collection (Default: false)
       */
      enabled?: boolean;
      /**
       * The default TTL in seconds. Can be overwritten per collection (Default: 120)
       */
      ttlSec?: number;
      /**
       * Clear the cache for the whole collection if an entry gets updated (Default: true)
       */
      invalidateOnUpdate?: boolean;
      /**
       * A map of collections specific settings
       */
      collections?: {
        /**
         * This interface was referenced by `undefined`'s JSON-Schema definition
         * via the `patternProperty` "^.*$".
         */
        [k: string]: {
          enabled?: boolean;
          ttlSec?: number;
          invalidateOnUpdate?: boolean;
          [k: string]: any;
        };
      };
    };
  };
  "Mashroom Storage Filestore Provider"?: {
    /**
     * Folder to store the data files. The base for relative paths is the Mashroom config file (Default: ./data/storage)
     */
    dataFolder?: string;
    /**
     * Check JSON files for external changes after this period.
     * If you set this to a value <= 0 the file timestamp will be checked on every access which will cause (Default: 2000)
     */
    checkExternalChangePeriodMs?: number;
    /**
     * Pretty print the JSON files to make it human readable (Default: true)
     */
    prettyPrintJson?: boolean;
  };
  "Mashroom Storage MongoDB Provider"?: MongoDbConfig;
  "Mashroom VHost Path Mapper Middleware"?: {
    considerHttpHeaders?: string[];
    hosts: {
      /**
       * This interface was referenced by `undefined`'s JSON-Schema definition
       * via the `patternProperty` "^[^/]+$".
       */
      [k: string]: {
        frontendBasePath?: string;
        mapping?: {
          /**
           * This interface was referenced by `undefined`'s JSON-Schema definition
           * via the `patternProperty` "^/.*$".
           */
          [k: string]: string;
        };
      };
    };
    [k: string]: any;
  };
  "Mashroom WebSocket Webapp"?: {
    /**
     * The path where the clients can connect (Default: /websocket)
     */
    path?: string;
    /**
     * The path where messages are temporary stored during client reconnect. When set to null or empty string, buffering is disabled (Default: null)
     */
    reconnectMessageBufferFolder?: PackagerRelativeOrSystemPath | null;
    /**
     * Time for how long are messages buffered during reconnect (Default: 5)
     */
    reconnectTimeoutSec?: number;
    /**
     * An optional array of roles that are required to connect (Default: null)
     */
    restrictToRoles?: string[] | null;
    /**
     * Enable periodic keep alive messages to all clients.
     * This is useful if you want to prevent reverse proxies to close connections because of a read timeout (Default: true)
     */
    enableKeepAlive?: boolean;
    /**
     * Interval for keepalive messages in seconds (Default: 15)
     */
    keepAliveIntervalSec?: number;
    /**
     * Max allowed WebSocket connections per node (Default: 2000)
     */
    maxConnections?: number;
    [k: string]: any;
  };
  "Mashroom Robots Middleware"?: {
    /**
     * The path to the robots.txt file. Can be relative to the server config file or absolute
     */
    "robots.txt"?: string;
  };
  "Mashroom CDN Services"?: {
    /**
     * A list of CDN hosts (default: [])
     */
    cdnHosts?: string[];
  };
  [k: string]: any;
}
export interface IORedisConfig {
  /**
   * Passed to the Redis constructor of https://github.com/luin/ioredis
   */
  redisOptions?: {
    host?: string;
    port?: string;
    /**
     * Cache key prefix (Default: mashroom:cache:)
     */
    keyPrefix?: string;
    /**
     * Identifies a group of Redis instances composed of a master and one or more slaves
     */
    name?: string;
    /**
     * List of sentinel nodes to connect to
     */
    sentinels?: {
      host?: string;
      port?: string;
      [k: string]: any;
    }[];
    [k: string]: any;
  };
  /**
   * Enables cluster support
   */
  cluster?: boolean;
  clusterNodes?: {
    host?: string;
    port?: string;
    [k: string]: any;
  }[];
  /**
   * Passed as second argument of the Redis.Cluster constructor of ioredis
   */
  clusterOptions?: {
    [k: string]: any;
  };
  [k: string]: any;
}
export interface MongoDbConfig {
  /**
   * A MongoDB connection string
   */
  uri: string;
  /**
   * The MongoDB connection options (see https://mongodb.github.io/node-mongodb-native/2.2/reference/connecting/connection-settings)
   */
  connectionOptions?: {
    [k: string]: any;
  };
}