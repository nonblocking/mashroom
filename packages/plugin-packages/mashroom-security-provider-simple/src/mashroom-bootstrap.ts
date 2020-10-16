
import MashroomSimpleSecurityProvider from './MashroomSimpleSecurityProvider';

import type {MashroomSecurityProviderPluginBootstrapFunction} from '@mashroom/mashroom-security/type-definitions';

const bootstrap: MashroomSecurityProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const { users: userStorePath, loginPage, authenticationTimeoutSec } = pluginConfig;
    const pluginContext = pluginContextHolder.getPluginContext();
    return new MashroomSimpleSecurityProvider(userStorePath, loginPage, pluginContext.serverConfig.serverRootFolder, authenticationTimeoutSec, pluginContext.loggerFactory);
};

export default bootstrap;
