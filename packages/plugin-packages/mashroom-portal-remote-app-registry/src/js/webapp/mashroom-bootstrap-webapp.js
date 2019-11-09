// @flow

import fs from 'fs';
import path from 'path';
import {registerBackgroundJobHolder} from '../context';
import webapp from './webapp';
import RegisterPortalRemoteAppsBackgroundJob from '../jobs/RegisterPortalRemoteAppsBackgroundJob';

import type {
    MashroomLoggerFactory,
    MashroomPluginConfig,
    MashroomPluginContextHolder,
    MashroomWebAppPluginBootstrapFunction
} from '@mashroom/mashroom/type-definitions';
import type {MashroomPortalRemoteAppEndpointService} from '../../../type-definitions';

const bootstrap: MashroomWebAppPluginBootstrapFunction = async (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) => {
    const { remotePortalAppUrls, checkIntervalSec, registrationRefreshIntervalSec } = pluginConfig;
    const pluginContext = contextHolder.getPluginContext();

    const registerBackgroundJob = new RegisterPortalRemoteAppsBackgroundJob(checkIntervalSec, registrationRefreshIntervalSec, contextHolder);
    registerBackgroundJobHolder.backgroundJob = registerBackgroundJob;
    const portalRemoteAppEndpointService: MashroomPortalRemoteAppEndpointService = contextHolder.getPluginContext().services.remotePortalAppEndpoint.service;

    await registerRemotePortalAppsFromConfigFile(remotePortalAppUrls, pluginContext.serverConfig.serverRootFolder, portalRemoteAppEndpointService, pluginContext.loggerFactory);

    registerBackgroundJob.start();

    return webapp;
};

async function registerRemotePortalAppsFromConfigFile(configFilePath: string, serverRootFolder: string, portalRemoteAppEndpointService: MashroomPortalRemoteAppEndpointService, loggerFactory: MashroomLoggerFactory) {
    const logger = loggerFactory('mashroom.portal.remoteAppRegistry')

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

export default bootstrap;
