import {URL} from 'url';
import {
    META_INFO_FLAG_OPEN_MICROFRONTENDS,
    ANNOTATION_META_INFO,
    ANNOTATION_DEFAULT_RESTRICT_VIEW_TO_ROLES,
    ANNOTATION_ROLE_PERMISSIONS,
    ANNOTATION_PROXIES_RESTRICT_TO_ROLES
} from './constants';
import fetchRemoteJSONorYAML from './fetchRemoteJSONorYAML';
import type {
    MashroomPluginScannerHints,
    MashroomLogger,
    MashroomPluginPackageDefinition,
    MashroomPluginPackageDefinitionAndMeta,
    MashroomPluginPackageMeta} from '@mashroom/mashroom/type-definitions';
import type {MashroomPlugins} from '@mashroom/mashroom-json-schemas/type-definitions';
import type {HttpsOpenMicrofrontendsOrgSchemas100} from '@open-microfrontends/types/OpenMicrofrontendDescription';

const OPEN_MICROFRONTEND_VERSION_REGEX = /^(1\.\d+\.\d+)$/;

export default async (packageUrl: URL, scannerHints: MashroomPluginScannerHints, description: HttpsOpenMicrofrontendsOrgSchemas100, logger: MashroomLogger): Promise<MashroomPluginPackageDefinitionAndMeta> => {
    const {openMicrofrontends, info, microfrontends} = description;

    if (!openMicrofrontends || !OPEN_MICROFRONTEND_VERSION_REGEX.test(openMicrofrontends)) {
        throw new Error(`Unsupported OpenMicrofrontends version: ${openMicrofrontends}`);
    }

    const unsupportedFeatureMessages: Array<string> = [];

    let buildManifestPath: string | undefined;
    microfrontends.forEach((omf) => {
        if (omf.assets.buildManifestPath) {
            if (!buildManifestPath) {
                buildManifestPath = omf.assets.buildManifestPath;
            } else if (omf.assets.buildManifestPath !== buildManifestPath) {
                logger.warn(`The build manifests found in OpenMicrofrontends descriptor ${packageUrl} . Choosing: ${buildManifestPath}`);
            }
        }
    });

    // Check the build manifest for version info (only if no scannerHints.packageVersion is set, which probably the docker image version and has precedence)
    let buildManifestVersion: string | undefined;
    if (!scannerHints.packageVersion && buildManifestPath) {
        try {
            const buildManifest = await fetchRemoteJSONorYAML(new URL(buildManifestPath, packageUrl), logger);
            if (buildManifest) {
                buildManifestVersion = buildManifest.version || buildManifest.timestamp;
                if (!buildManifestVersion) {
                    logger.warn(`The build manifest at ${buildManifestPath} in ${packageUrl} does not contain a version or timestamp!`);
                }
            } else {
                logger.warn(`Couldn't load build manifest ${buildManifestPath} from ${packageUrl}.`);
            }
        } catch (e) {
            logger.warn(`Couldn't load build manifest ${buildManifestPath} from ${packageUrl}: ${e}`);
        }
    }

    const meta: MashroomPluginPackageMeta = {
        name: scannerHints.packageName ?? packageUrl.hostname,
        version: scannerHints.packageVersion ?? buildManifestVersion ?? String(Date.now()),
        description: info?.description ?? null,
        homepage: null,
        author: info?.contact?.author ?? null,
        license: null,
    };
    const definition: MashroomPluginPackageDefinition = {
        buildManifestPath,
        plugins: [],
    };

    microfrontends.forEach((omf) => {
        const {name, rendererFunctionName, assets, ssr, userPermissions, apiProxies, config, annotations} = omf;
        let rolePermissions: Record<string, string[]> | undefined = annotations?.[ANNOTATION_ROLE_PERMISSIONS];
        let defaultRestrictViewToRoles: string[] | undefined = annotations?.[ANNOTATION_DEFAULT_RESTRICT_VIEW_TO_ROLES];
        let proxiesRestrictToRoles: Record<string, string[]> | undefined = annotations?.[ANNOTATION_PROXIES_RESTRICT_TO_ROLES];
        let extraMetaInfo = annotations?.[ANNOTATION_META_INFO];
        if (rolePermissions && typeof rolePermissions !== 'object') {
            logger.warn(`Invalid rolePermissions annotation for OpenMicrofrontend ${name}: ${rolePermissions}`);
            rolePermissions = undefined;
        }
        if (defaultRestrictViewToRoles && !Array.isArray(defaultRestrictViewToRoles)) {
            logger.warn(`Invalid defaultRestrictViewToRoles annotation for OpenMicrofrontend ${name}: ${defaultRestrictViewToRoles}`);
            defaultRestrictViewToRoles = undefined;
        }
        if (proxiesRestrictToRoles && typeof proxiesRestrictToRoles !== 'object') {
            logger.warn(`Invalid proxiesRestrictToRoles annotation for OpenMicrofrontend ${name}: ${proxiesRestrictToRoles}`);
            proxiesRestrictToRoles = undefined;
        }
        if (extraMetaInfo && typeof extraMetaInfo !== 'object') {
            logger.warn(`Invalid extraMetaInfo annotation for OpenMicrofrontend ${name}: ${extraMetaInfo}`);
            extraMetaInfo = undefined;
        }
        let proxies: Record<string, any> | undefined;
        if (typeof apiProxies === 'object') {
            proxies = {};
            Object.keys(apiProxies).forEach((proxyName) => {
                const apiProxy = apiProxies![proxyName];
                if (apiProxy.security) {
                    unsupportedFeatureMessages.push(`Microfrontend "${name}": apiProxy "${proxyName}" requires security: You have to define an additional "portal-app-config" plugin.`);
                }
                if ('path' in apiProxy) {
                    proxies![proxyName] = {
                        targetPath: apiProxy.path,
                        restrictToRoles: proxiesRestrictToRoles?.[proxyName],
                    };
                } else {
                    const targets = apiProxy.targets;
                    if (targets && Array.isArray(targets)) {
                        unsupportedFeatureMessages.push(`Microfrontend "${name}": apiProxy "${proxyName}" has multiple possible targets, choosing: ${targets[0].url}. Define an additional "portal-app-config" plugin to select the correct one.`);
                        proxies![proxyName] = {
                            targetUri: targets[0].url,
                            restrictToRoles: proxiesRestrictToRoles?.[proxyName],
                        };
                    } else {
                        logger.warn(`No targets defined for apiProxy ${proxyName} of OpenMicrofrontend ${name}. Ignoring it.`);
                    }
                }
            });
        }
        if (ssr?.security) {
            unsupportedFeatureMessages.push(`Microfrontend "${name}": Requires security for the SSR route. This requires an additional "portal-app-config" plugin.`);
        }
        if (userPermissions?.provided) {
            unsupportedFeatureMessages.push(`Microfrontend "${name}": Found a userPermissions provider. This requires an additional "portal-app-config" plugin.`);
        }

        const portalApp2: MashroomPlugins['plugins'][number] = {
            name,
            type: 'portal-app2',
            clientBootstrap: rendererFunctionName,
            resources: {
                moduleSystem: assets.js.moduleSystem,
                importMap: assets.js.importMap,
                js: assets.js.initial,
                css: assets.css,
            },
            remote: {
                resourcesRoot: assets.basePath ?? '/',
                ssrInitialHtmlPath: ssr?.path,
            },
            defaultConfig: {
                title: omf.title,
                description: omf.description,
                proxies,
                rolePermissions,
                defaultRestrictViewToRoles,
                metaInfo: {
                    [META_INFO_FLAG_OPEN_MICROFRONTENDS]: true,
                    ...(extraMetaInfo || {}),
                },
                appConfig: config?.default,
            }
        };

        definition.plugins.push(portalApp2);
    });

    if (unsupportedFeatureMessages.length > 0) {
        logger.warn(`Unsupported features in OpenMicrofrontend descriptor ${packageUrl}:\n\t${unsupportedFeatureMessages.join('\n\t')}`);
    }

    return {
        packageUrl,
        meta,
        definition,
    };
};
