// @flow

import MashroomI18NService from './MashroomI18NService';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {availableLanguages, defaultLanguage, messages: messagesFolder} = pluginConfig;

    const pluginContext = pluginContextHolder.getPluginContext();
    const service = new MashroomI18NService(availableLanguages, defaultLanguage, messagesFolder, pluginContext.serverConfig.serverRootFolder, pluginContext.loggerFactory);

    return {
        service,
    };
};

export default bootstrap;
