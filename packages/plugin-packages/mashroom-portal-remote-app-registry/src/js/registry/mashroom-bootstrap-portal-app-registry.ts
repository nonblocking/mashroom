
import fs from 'fs';
import path from 'path';
import context from '../context';
import healthProbe from '../health/health-probe';
import {registerRemoteAppMetrics, unregisterRemoteAppMetrics} from '../metrics/remote-app-metrics';

import type {MashroomPortalAppRegistryBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';
import type {MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {MashroomPortalRemoteAppEndpointService} from '../../../type-definitions';

const bootstrap: MashroomPortalAppRegistryBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const { remotePortalAppUrls } = pluginConfig;
    const {loggerFactory, services, serverConfig} = pluginContextHolder.getPluginContext();

    const portalRemoteAppEndpointService: MashroomPortalRemoteAppEndpointService = services.remotePortalAppEndpoint!.service;

    await registerRemotePortalAppsFromConfigFile(remotePortalAppUrls, serverConfig.serverRootFolder, portalRemoteAppEndpointService, loggerFactory);

    services.core.healthProbeService.registerProbe(pluginName, healthProbe);
    registerRemoteAppMetrics(pluginContextHolder);

    services.core.pluginService.onUnloadOnce(pluginName, () => {
        services.core.healthProbeService.unregisterProbe(pluginName);
        unregisterRemoteAppMetrics();
    });

    return context.registry;
};

export default bootstrap;

async function registerRemotePortalAppsFromConfigFile(configFilePath: string, serverRootFolder: string, portalRemoteAppEndpointService: MashroomPortalRemoteAppEndpointService, loggerFactory: MashroomLoggerFactory) {
    const logger = loggerFactory('mashroom.portal.remoteAppRegistry');

    if (!configFilePath) {
        return;
    }

    if (!path.isAbsolute(configFilePath)) {
        configFilePath = path.resolve(serverRootFolder, configFilePath);
    }

    if (fs.existsSync(configFilePath)) {
        logger.info(`Loading remote portal app URLs from: ${configFilePath}`);

        const remotePortalAppModule = require(configFilePath);
        const remotePortalAppData = remotePortalAppModule.default ?? remotePortalAppModule;
        const remotePortalAppURLs: Array<string> = Array.isArray(remotePortalAppData) ? remotePortalAppData : (remotePortalAppData.remotePortalApps || []);

        if (Array.isArray(remotePortalAppURLs)) {
            for (const remotePortalAppURL of remotePortalAppURLs) {
                await portalRemoteAppEndpointService.registerRemoteAppUrl(remotePortalAppURL);
            }
        }
    } else {
        logger.warn(`Remote portal app URLs config file not found: ${configFilePath}`);
    }
}

