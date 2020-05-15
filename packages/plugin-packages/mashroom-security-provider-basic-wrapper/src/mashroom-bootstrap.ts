
import MashroomBasicWrapperSecurityProvider from './MashroomBasicWrapperSecurityProvider';

import {MashroomSecurityProviderPluginBootstrapFunction} from '@mashroom/mashroom-security/type-definitions';

const bootstrap: MashroomSecurityProviderPluginBootstrapFunction = async (pluginName, pluginConfig) => {
    const {
        targetSecurityProvider,
        onlyPreemptive,
        realm,
    } = pluginConfig;

    return new MashroomBasicWrapperSecurityProvider(targetSecurityProvider, onlyPreemptive, realm);
};

export default bootstrap;
