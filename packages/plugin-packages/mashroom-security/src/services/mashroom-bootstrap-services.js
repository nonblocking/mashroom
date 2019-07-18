// @flow

import context from '../context/global_context';
import MashroomSecurityService from './MashroomSecurityService';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const securityProvider = pluginConfig.provider;

    const pluginContext = pluginContextHolder.getPluginContext();
    const service = new MashroomSecurityService(securityProvider, context.pluginRegistry,
        pluginConfig.acl, pluginContext.serverConfig.serverRootFolder, pluginConfig.loginPage, pluginContext.loggerFactory);

    return {
        service,
    };
};

export default bootstrap;
