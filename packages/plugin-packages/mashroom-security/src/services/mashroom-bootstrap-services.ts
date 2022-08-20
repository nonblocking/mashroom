
import context from '../context/global_context';
import MashroomSecurityACLChecker from '../acl/MashroomSecurityACLChecker';
import MashroomSecurityService from './MashroomSecurityService';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const { provider, forwardQueryHintsToProvider, acl } = pluginConfig;

    const pluginContext = pluginContextHolder.getPluginContext();

    const aclChecker = new MashroomSecurityACLChecker(acl, pluginContext.serverConfig.serverRootFolder, pluginContext.loggerFactory);

    const service = new MashroomSecurityService(provider, forwardQueryHintsToProvider, context.pluginRegistry, aclChecker);

    return {
        service,
    };
};

export default bootstrap;
