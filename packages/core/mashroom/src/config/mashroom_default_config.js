// @flow

import os from 'os';

import type {MashroomServerConfig} from '../../type-definitions';

const config: MashroomServerConfig = {
    name: 'Mashroom Server',
    port: 5050,
    xPowerByHeader: 'Mashroom Server',
    serverRootFolder: '.',
    tmpFolder: os.tmpdir(),
    pluginPackageFolders: [{
        path: './node_modules/@mashroom',
        watch: true,
    }],
    ignorePlugins: [],
    indexPage: '/'
};

export default config;
