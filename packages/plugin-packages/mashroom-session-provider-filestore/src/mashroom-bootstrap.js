// @flow

import sessionFileStore from 'session-file-store';

import type {MashroomSessionStoreProviderPluginBootstrapFunction} from '@mashroom/mashroom-session/type-definitions';

const bootstrap: MashroomSessionStoreProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder, expressSession) => {
    const options = Object.assign({}, pluginConfig);
    const FileStore = sessionFileStore(expressSession);
    return new FileStore(options);
};

export default bootstrap;
