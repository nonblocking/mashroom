// @flow

import context from '../context/global_context';
import MashroomSecurityService from './MashroomSecurityService';
import MashroomSecurityACLChecker from '../acl/MashroomSecurityACLChecker';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const { provider, acl } = pluginConfig;

    const pluginContext = pluginContextHolder.getPluginContext();

    const aclChecker = new MashroomSecurityACLChecker(acl, pluginContext.serverConfig.serverRootFolder, pluginContext.loggerFactory);

    const service = new MashroomSecurityService(provider, context.pluginRegistry, aclChecker, pluginContext.loggerFactory);

    return {
        service,
    };
};

export default bootstrap;
