#!/usr/bin/env node

/*
 * Usage:
 *
 * node server.js [server-root]
 */

import minimist from 'minimist';
import path from 'path';
import {mashroomServerContextFactory} from './index';

import type {MashroomLogger} from '../type-definitions';
import type {MashroomServer} from '../type-definitions/internal';

const SERVER_STOP_TIMEOUT = 5 * 1000; // 5 sec

const argv = minimist(process.argv.slice(2));
let serverRootPath = process.cwd();
if (argv._ && argv._.length > 0) {
    serverRootPath = path.resolve(serverRootPath, argv._[0]);
}

process.chdir(serverRootPath);
let stopping = false;

startServer();

async function startServer() {

    const {server, loggerFactory} = await mashroomServerContextFactory(serverRootPath);
    const logger: MashroomLogger = loggerFactory('server');

    server.start();

    if (process.platform === 'win32') {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const rl = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.on('SIGINT', async () => {
            await stopServer(server, logger);
        });
    }

    process.on('SIGINT', async () => {
        await stopServer(server, logger);
    });
    process.on('SIGTERM', async () => {
        await stopServer(server, logger);
    });
}

async function stopServer(server: MashroomServer, log: MashroomLogger) {
    if (!stopping) {
        stopping = true;
        log.info('Stopping Mashroom Server...');
        setTimeout(() => {
            log.debug(`Server didn't stop within ${SERVER_STOP_TIMEOUT} ms. Exiting now.`);
            process.exit(0);
        }, SERVER_STOP_TIMEOUT);
        await server.stop();
        process.exit(0);
    }
}