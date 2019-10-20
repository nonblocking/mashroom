// @flow
/* eslint no-console: off */

import os from 'os';
import log4js from 'log4js';
import {existsSync} from 'fs';
import defaultConfig from './log4js_default_config';

import type {LogLevel, MashroomLoggerDelegate} from '../../../../type-definitions';

const ENVIRONMENT = process.env.NODE_ENV || 'development';
const HOSTNAME = os.hostname() || 'localhost';

const CONFIG_FILES = [
    `log4js.${HOSTNAME}.${ENVIRONMENT}.js`,
    `log4js.${HOSTNAME}.${ENVIRONMENT}.json`,
    `log4js.${HOSTNAME}.js`,
    `log4js.${HOSTNAME}.json`,
    `log4js.${ENVIRONMENT}.js`,
    `log4js.${ENVIRONMENT}.json`,
    'log4js.js',
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
                const logConfig = require(configFile);
                log4js.configure(logConfig);
                log4js.getLogger().info('Considering log config files: ', CONFIG_FILES);
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

    log(category: string, level: LogLevel, context: ?{}, message: string, args: ?any[]) {
        const logger = log4js.getLogger(category || undefined);
        if (level === 'debug' && !logger.isDebugEnabled()) {
            return;
        }
        if (level === 'info' && !logger.isInfoEnabled()) {
            return;
        }

        if (context) {
            for (const name in context) {
                if (context.hasOwnProperty(name)) {
                    logger.addContext(name, context[name]);
                }
            }
        }

        try {
            switch (level) {
                case 'error':
                    args && args.length > 0 ? logger.error(message, ...args) : logger.error(message);
                    break;
                case 'warn':
                    args && args.length > 0 ? logger.warn(message, ...args) : logger.warn(message);
                    break;
                case 'info':
                    args && args.length > 0 ? logger.info(message, ...args) : logger.info(message);
                    break;
                default:
                case 'debug':
                    args && args.length > 0 ? logger.debug(message, ...args) : logger.debug(message);
                    break;
            }

        } finally {
            if (context) {
                logger.clearContext();
            }
        }
    }

}
