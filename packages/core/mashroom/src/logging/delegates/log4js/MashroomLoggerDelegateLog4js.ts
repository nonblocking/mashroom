
import os from 'os';
import {existsSync} from 'fs';
import log4js from 'log4js';
import {configFileUtils} from '@mashroom/mashroom-utils';
import defaultConfig from './log4js-default-config';

import type {LogLevel} from '../../../../type-definitions';
import type {MashroomLoggerDelegate} from '../../../../type-definitions/internal';

const ENVIRONMENT = process.env.NODE_ENV || 'development';
const HOSTNAME = os.hostname() || 'localhost';

const CONFIG_FILES = [
    `log4js.${HOSTNAME}.${ENVIRONMENT}.ts`,
    `log4js.${HOSTNAME}.${ENVIRONMENT}.mjs`,
    `log4js.${HOSTNAME}.${ENVIRONMENT}.cjs`,
    `log4js.${HOSTNAME}.${ENVIRONMENT}.js`,
    `log4js.${HOSTNAME}.${ENVIRONMENT}.yaml`,
    `log4js.${HOSTNAME}.${ENVIRONMENT}.json`,
    `log4js.${HOSTNAME}.ts`,
    `log4js.${HOSTNAME}.mjs`,
    `log4js.${HOSTNAME}.cjs`,
    `log4js.${HOSTNAME}.js`,
    `log4js.${HOSTNAME}.json`,
    `log4js.${ENVIRONMENT}.ts`,
    `log4js.${ENVIRONMENT}.mjs`,
    `log4js.${ENVIRONMENT}.cjs`,
    `log4js.${ENVIRONMENT}.js`,
    `log4js.${ENVIRONMENT}.yaml`,
    `log4js.${ENVIRONMENT}.json`,
    'log4js.ts',
    'log4js.mjs',
    'log4js.cjs',
    'log4js.js',
    'log4js.yaml',
    'log4js.json',
];

/**
 * Log4js implementation of a MashroomLoggerDelegate
 */
export default class MashroomLoggerDelegateLog4js implements MashroomLoggerDelegate {

    async init(serverRootPath: string) {
        try {
            const configFiles = CONFIG_FILES.map((name) => `${serverRootPath}/${name}`);
            const configFile = configFiles.find((file) => existsSync(file));

            if (configFile) {
                const logConfig = await configFileUtils.loadConfigFile(configFile);
                log4js.configure(logConfig);
                log4js.getLogger().info('Considering log config files (take the first match): ', CONFIG_FILES);
                log4js.getLogger().info(`log4js configured from: ${configFile}`);
            } else {
                log4js.configure(defaultConfig);
                log4js.getLogger().info('Considering log config files: ', CONFIG_FILES);
                log4js.getLogger().warn('No log config files found, using default config');
            }
        } catch (error) {
            console.error(error);
        }
    }

    log(category: string, level: LogLevel, context: any | undefined | null, message: string, args: any[] | undefined | null) {
        const logger = log4js.getLogger(category || undefined);
        if (level === 'debug' && !logger.isDebugEnabled()) {
            return;
        }
        if (level === 'info' && !logger.isInfoEnabled()) {
            return;
        }

        if (context) {
            for (const name in context) {
                if (name in context) {
                    logger.addContext(name, context[name]);
                }
            }
        }

        try {
            switch (level) {
                case 'error':
                    logger.error(message, ...args ?? []);
                    break;
                case 'warn':
                    logger.warn(message, ...args ?? []);
                    break;
                case 'info':
                    logger.info(message, ...args ?? []);
                    break;
                default:
                case 'debug':
                    logger.debug(message, ...args ?? []);
                    break;
            }

        } finally {
            if (context) {
                logger.clearContext();
            }
        }
    }

}
