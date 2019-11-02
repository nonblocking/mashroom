// @flow

import sessionFileStore from 'session-file-store';

import type {MashroomSessionStoreProviderPluginBootstrapFunction} from '@mashroom/mashroom-session/type-definitions';

const bootstrap: MashroomSessionStoreProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder, expressSession) => {
    const logger = pluginContextHolder.getPluginContext().loggerFactory('mashroom.session.provider.filestore');
    logger.info('Using file store options:', pluginConfig);
    const options = Object.assign({}, pluginConfig, {
        logFn: () => logger.info
    });
    const FileStore = sessionFileStore(expressSession);
    return new FileStore(options);
};

export default bootstrap;
