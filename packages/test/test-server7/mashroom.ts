import type {MashroomServerConfig} from '@mashroom/mashroom-json-schemas/type-definitions';

const serverConfig: MashroomServerConfig = {
    name: 'Mashroom Test Server 7',
    port: 5050,
    xPoweredByHeader: null,
    externalPluginConfigFileNames: ['mashroom'],
    pluginPackageFolders: [
        {
            path: '../../plugin-packages',
            devMode: true
        },
        {
            path: 'test-plugin1',
            devMode: true
        },
        {
            path: 'test-plugin2',
            devMode: true
        },
    ],
    indexPage: '/',
    ignorePlugins: [
        'Mashroom Storage MongoDB Provider',
        'Mashroom Memory Cache Services',
        'Mashroom LDAP Security Provider',
        'Mashroom OpenID Connect Security Provider',
        'Mashroom Messaging External Provider MQTT',
        'Mashroom Messaging External Provider AMQP',
        "Mashroom Messaging External Provider Redis",
        'Mashroom Session MongoDB Provider',
        'Mashroom Session Redis Provider',
        'Mashroom Session Filestore Provider',
        'Mashroom Memory Cache Redis Provider',
        "Mashroom Remote Package Scanner Kubernetes",
        "Mashroom Remote Package Scanner Kubernetes Admin Webapp",
        "Mashroom Remote Package Scanner Kubernetes Admin Webapp Integration",
        'Mashroom Monitoring PM2 Exporter',
        'Mashroom Http Proxy Add User Headers Interceptor',
        'Mashroom Http Proxy Add Access Token Interceptor',
        'Mashroom CDN Services',
        'Mashroom Robots Middleware'
    ],
    plugins: {
        'Mashroom Helmet Middleware': {
        },
        'Mashroom Error Pages Middleware': {
            mapping: {
                '404': './test-error-pages/404_custom.html'
            }
        },
        'Mashroom Session Middleware': {
            provider: 'memory',
            session: {
                cookie: {
                }
            }
        },
        'Mashroom Security Services': {
            provider: 'Mashroom Security Simple Provider',
            forwardQueryHintsToProvider: [
                'test1'
            ],
            acl: './acl.ts'
        },
        'Mashroom Security Simple Provider': {
            users: './users.ts',
            loginPage: '/login',
            authenticationTimeoutSec: 300
        },
        'Mashroom Security Default Login Webapp': {
            pageTitle: 'Mashroom Test Server',
        },
        'Mashroom Storage Services': {
            provider: 'Mashroom Storage Filestore Provider'
        },
        'Mashroom Storage Filestore Provider': {
            dataFolder: './data/storage',
        },
        'Mashroom Internationalization Services': {
            availableLanguages: [
                'en',
                'de'
            ],
            defaultLanguage: 'en'
        },
        'Mashroom Http Proxy Services': {
            rejectUnauthorized: false,
            poolMaxSockets: 10,
            socketTimeoutMs: 3000,
            proxyImpl: 'default'
        },
        'Mashroom WebSocket Webapp': {
            restrictToRoles: null,
            enableKeepAlive: true,
            keepAliveIntervalSec: 15,
            maxConnections: 20,
            reconnectMessageBufferFolder: './data/ws-reconnect-buffer'
        },
        'Mashroom Messaging Services': {
            externalProvider: null,
            userPrivateBaseTopic: 'user',
            enableWebSockets: true,
            topicACL: './topicACL.ts'
        },
        'Mashroom Portal WebApp': {
            adminApp: 'Mashroom Portal Admin App',
            defaultTheme: 'Mashroom Portal Default Theme',
           authenticationExpiration: {
               warnBeforeExpirationSec: 60,
               autoExtend: false,
               onExpiration: {
                    strategy: 'reload'
                }
            },
            ignoreMissingAppsOnPages: false,
            ssrConfig: {
                ssrEnable: true,
                renderTimoutMs: 2000,
                cacheEnable: true,
                cacheTTLSec: 300
            }
        },
        'Mashroom Portal Default Theme': {
            showEnvAndVersions: true,
            spaMode: true
        },
        'Mashroom Remote Package Scanner': {
            remotePackageUrls: './remotePackageUrls.ts'
        },
        'Mashroom Remote Package Scanner Admin Webapp': {
            showAddRemotePluginPackageForm: true
        }
    }
};

export default serverConfig;
