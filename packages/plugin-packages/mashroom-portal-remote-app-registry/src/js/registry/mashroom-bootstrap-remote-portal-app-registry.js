// @flow

import fs from 'fs';
import path from 'path';
import context from '../context';

import type {MashroomRemotePortalAppRegistryBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';
import RegisterPortalRemoteAppsBackgroundJob from '../jobs/RegisterPortalRemoteAppsBackgroundJob';

import type {MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {MashroomPortalRemoteAppEndpointService} from '../../../type-definitions';

const bootstrap: MashroomRemotePortalAppRegistryBootstrapFunction = async (pluginName, pluginConfig, contextHolder) => {
    const { remotePortalAppUrls, checkTimeoutSec, checkIntervalSec, registrationRefreshIntervalSec } = pluginConfig;

    const pluginContext = contextHolder.getPluginContext();

    const registerBackgroundJob = new RegisterPortalRemoteAppsBackgroundJob(checkTimeoutSec, checkIntervalSec, registrationRefreshIntervalSec, contextHolder);
    context.backgroundJob = registerBackgroundJob;
    const portalRemoteAppEndpointService: MashroomPortalRemoteAppEndpointService = pluginContext.services.remotePortalAppEndpoint.service;

    await registerRemotePortalAppsFromConfigFile(remotePortalAppUrls, pluginContext.serverConfig.serverRootFolder, portalRemoteAppEndpointService, pluginContext.loggerFactory);

    registerBackgroundJob.start();
    pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
        registerBackgroundJob.stop();
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
        const remotePortalAppURLs = require(configFilePath);
        if (Array.isArray(remotePortalAppURLs)) {
            for (const remotePortalAppURL of remotePortalAppURLs) {
                if (typeof(remotePortalAppURL) === 'string') {
                    await portalRemoteAppEndpointService.registerRemoteAppUrl(remotePortalAppURL);
                }
            }
        }

    } else {
        logger.warn(`Remote portal app URLs config file not found: ${configFilePath}`);
    }
}

