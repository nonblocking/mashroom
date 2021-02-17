
import os from 'os';
import path from 'path';
import {existsSync} from 'fs';
import {createReadonlyProxy} from '@mashroom/mashroom-utils/lib/readonly_utils';
import {evaluateTemplatesInConfigObject} from '@mashroom/mashroom-utils/lib/config_utils';
import {deepAssign} from '@mashroom/mashroom-utils/lib/model_utils';
import defaultConfig from './mashroom_default_config';
import ServerConfigurationError from '../errors/ServerConfigurationError';

import type {MashroomLogger, MashroomLoggerFactory} from '../../type-definitions';
import type {
    MashroomServerConfigHolder,
    MashroomServerConfigLoader as MashroomServerConfigLoaderType
} from '../../type-definitions/internal';

const ENVIRONMENT = process.env.NODE_ENV || 'development';
const HOSTNAME = os.hostname() || 'localhost';

const CONFIG_FILES = [
    'mashroom.json',
    'mashroom.js',
    `mashroom.${ENVIRONMENT}.json`,
    `mashroom.${ENVIRONMENT}.js`,
    `mashroom.${HOSTNAME}.json`,
    `mashroom.${HOSTNAME}.js`,
    `mashroom.${HOSTNAME}.${ENVIRONMENT}.json`,
    `mashroom.${HOSTNAME}.${ENVIRONMENT}.js`
];

export default class MashroomServerConfigLoader implements MashroomServerConfigLoaderType {

    private _logger: MashroomLogger;

    constructor(loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.config');
    }

    load(serverRootPath: string): MashroomServerConfigHolder {
        // Make serverRootPath absolute
        if (!path.isAbsolute(serverRootPath)) {
            serverRootPath = path.resolve(serverRootPath);
        }

        this._logger.info('Considering config files:', CONFIG_FILES);
        const configFiles = CONFIG_FILES.map((name) => `${serverRootPath}/${name}`);
        const existingConfigFiles = configFiles.filter((file) => existsSync(file));

        let config = defaultConfig;
        if (existingConfigFiles.length > 0) {
            for (const configFile of existingConfigFiles) {
                this._logger.info(`Loading config file: ${configFile}`);
                try {
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const externalConfig = require(configFile);
                    config = deepAssign({}, config, externalConfig);
                } catch (e) {
                    this._logger.error(`Loading config file failed: ${configFile}`, e);
                    throw new ServerConfigurationError(`Loading config file failed: ${configFile}`);
                }
            }
        } else {
            this._logger.warn('No config file found, using default config.');
        }

        const serverRootFolder = serverRootPath;

        // Fix plugin package folder config
        const pluginPackageFolders = config.pluginPackageFolders.map((ppf) => {
            let absolutePath = ppf.path;
            if (!path.isAbsolute(ppf.path)) {
                absolutePath = path.resolve(serverRootPath, ppf.path);
            }
            return {
                path: absolutePath,
                watch: !!ppf.watch || !!ppf.devMode,
                devMode: !!ppf.devMode,
            };
        });

        config = {
            ...config,
            serverRootFolder,
            pluginPackageFolders
        };

        evaluateTemplatesInConfigObject(config, this._logger);

        return {
            getConfig: () => createReadonlyProxy(config),
        };
    }
}
