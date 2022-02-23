
import MashroomSimpleSecurityProvider from './MashroomSimpleSecurityProvider';

import type {MashroomSecurityProviderPluginBootstrapFunction} from '@mashroom/mashroom-security/type-definitions';

const bootstrap: MashroomSecurityProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const { users: userStorePath, loginPage, authenticationTimeoutSec } = pluginConfig;
    const { serverConfig, loggerFactory } = pluginContextHolder.getPluginContext();
    return new MashroomSimpleSecurityProvider(userStorePath, loginPage, serverConfig.serverRootFolder, authenticationTimeoutSec, loggerFactory);
};

export default bootstrap;
