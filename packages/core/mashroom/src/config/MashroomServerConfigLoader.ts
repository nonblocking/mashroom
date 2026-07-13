
import {hostname} from 'os';
import {resolve, isAbsolute} from 'path';
import {existsSync} from 'fs';
import {readonlyUtils, configUtils, configFileUtils, modelUtils} from '@mashroom/mashroom-utils';
import ServerConfigurationError from '../errors/ServerConfigurationError';
import defaultConfig from './mashroom-default-config';

import type {MashroomLogger, MashroomLoggerFactory} from '../../type-definitions';
import type {MashroomServerConfigLoader as MashroomServerConfigLoaderType} from '../../type-definitions/internal';

const ENVIRONMENT = process.env.NODE_ENV || 'development';
const HOSTNAME = hostname() || 'localhost';

const CONFIG_FILES = [
    'mashroom.json',
    'mashroom.yaml',
    'mashroom.js',
    'mashroom.ts',
    `mashroom.${ENVIRONMENT}.json`,
    `mashroom.${ENVIRONMENT}.yaml`,
    `mashroom.${ENVIRONMENT}.js`,
    `mashroom.${ENVIRONMENT}.cjs`,
    `mashroom.${ENVIRONMENT}.mjs`,
    `mashroom.${ENVIRONMENT}.ts`,
    `mashroom.${HOSTNAME}.json`,
    `mashroom.${HOSTNAME}.yaml`,
    `mashroom.${HOSTNAME}.js`,
    `mashroom.${HOSTNAME}.cjs`,
    `mashroom.${HOSTNAME}.mjs`,
    `mashroom.${HOSTNAME}.ts`,
    `mashroom.${HOSTNAME}.${ENVIRONMENT}.json`,
    `mashroom.${HOSTNAME}.${ENVIRONMENT}.yaml`,
    `mashroom.${HOSTNAME}.${ENVIRONMENT}.js`,
    `mashroom.${HOSTNAME}.${ENVIRONMENT}.cjs`,
    `mashroom.${HOSTNAME}.${ENVIRONMENT}.mjs`,
    `mashroom.${HOSTNAME}.${ENVIRONMENT}.ts`
];

export default class MashroomServerConfigLoader implements MashroomServerConfigLoaderType {

    private readonly _logger: MashroomLogger;

    constructor(loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.config');
    }

    async load(serverRootPath: string) {
        // Make serverRootPath absolute and fix it under windows
        serverRootPath = resolve(serverRootPath);

        this._logger.info('Considering config files (multiple possible):', CONFIG_FILES);
        const configFiles = CONFIG_FILES.map((name) => `${serverRootPath}/${name}`);
        const existingConfigFiles = configFiles.filter((file) => existsSync(file));

        let config = defaultConfig;
        if (existingConfigFiles.length > 0) {
            for (const configFile of existingConfigFiles) {
                this._logger.info(`Using config file: ${configFile}`);
                try {
                    const externalConfig = await configFileUtils.loadConfigFile(configFile);
                    config = modelUtils.deepAssign({}, config, externalConfig);
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
            if (!isAbsolute(ppf.path)) {
                absolutePath = resolve(serverRootPath, ppf.path);
            } else {
                // For windows, don't remove
                absolutePath = resolve(absolutePath);
            }
            return {
                path: absolutePath,
                watch: !!ppf.watch || !!ppf.devMode,
                devMode: !!ppf.devMode,
            };
        });

        // Consider deprecated "xPowerByHeader" config for backwards compatibility
        if (config.xPoweredByHeader === defaultConfig.xPoweredByHeader && config.xPowerByHeader) {
            this._logger.warn('The "xPowerByHeader" config is deprecated, use "xPoweredByHeader" instead');
            config = {
                ...config,
                xPoweredByHeader: config.xPowerByHeader,
            };
        }

        config = {
            ...config,
            serverRootFolder,
            pluginPackageFolders
        };

        configUtils.evaluateTemplatesInConfigObject(config, this._logger);

        return {
            getConfig: () => readonlyUtils.createReadonlyProxy(config),
        };
    }
}
