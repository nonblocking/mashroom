
import { isAbsolute, resolve } from 'path';
import sessionFileStore from 'session-file-store';

import type {Options} from 'session-file-store';

import type {MashroomSessionStoreProviderPluginBootstrapFunction} from '@mashroom/mashroom-session/type-definitions';

const bootstrap: MashroomSessionStoreProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder, expressSession) => {
    const { serverConfig, loggerFactory } = pluginContextHolder.getPluginContext();
    const logger = loggerFactory('mashroom.session.provider.filestore');

    let { path } = pluginConfig;
    if (!path) {
       logger.warn('No session path given, using /data/sessions') ;
       path = '/data/sessions';
    }
    if (!isAbsolute(path)) {
        path = resolve(serverConfig.serverRootFolder, path);
    }

    const options: Options = {
        ...pluginConfig,
        path,
        logFn: (msg: any): void => {
            logger.info('File store message:', msg);
        }
    };
    logger.info('Using file session store options:', options);

    const FileStore = sessionFileStore(expressSession);

    return new FileStore(options);
};

export default bootstrap;
