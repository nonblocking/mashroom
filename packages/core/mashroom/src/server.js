#!/usr/bin/env node
// @flow

/*
 * Usage:
 *
 * node server.js [server-root]
 */

import minimist from 'minimist';
import path from 'path';
import {mashroomServerContextFactory} from './index';

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
    const log = loggerFactory('server');

    server.start();

    if (process.platform === 'win32') {
        const rl = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.on('SIGINT', async () => {
            await stopServer(server, log);
        });
    }

    process.on('SIGINT', async () => {
        await stopServer(server, log);
    });
    process.on('SIGTERM', async () => {
        await stopServer(server, log);
    });
}

async function stopServer(server, log) {
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
