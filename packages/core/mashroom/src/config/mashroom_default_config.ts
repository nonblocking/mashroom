
import os from 'os';

import type {MashroomServerConfig} from '../../type-definitions';

const config: MashroomServerConfig = {
    name: 'Mashroom Server',
    port: 5050,
    httpsPort: null,
    tlsOptions: null,
    enableHttp2: false,
    xPowerByHeader: 'Mashroom Server',
    serverRootFolder: '.',
    tmpFolder: os.tmpdir(),
    pluginPackageFolders: [{
        path: './node_modules/@mashroom',
    }],
    ignorePlugins: [],
    indexPage: '/',
    devModeNpmExecutionTimeoutSec: undefined,
};

export default config;
