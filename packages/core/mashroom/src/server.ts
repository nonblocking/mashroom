#!/usr/bin/env node

/*
 * Usage:
 *
 * node server.js [server-root]
 */

import path from 'path';
import minimist from 'minimist';
import {mashroomServerContextFactory} from './index';

import type {MashroomLogger} from '../type-definitions';
import type {MashroomServer} from '../type-definitions/internal';

const WAIT_BEFORE_SERVER_CLOSE = process.env.WAIT_BEFORE_SERVER_CLOSE && parseInt(process.env.WAIT_BEFORE_SERVER_CLOSE);

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

    await server.start();

    if (process.platform === 'win32') {
        const rl = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.on('SIGINT', () => {
            stopServer(server, logger);
        });
    }

    process.on('SIGINT', () => {
        stopServer(server, logger);
    });
    process.on('SIGTERM', async () => {
        // Graceful shutdown on Kubernetes
        if (WAIT_BEFORE_SERVER_CLOSE) {
            logger.info(`Graceful shutdown, waiting for ${WAIT_BEFORE_SERVER_CLOSE}sec`);
            setTimeout(() => {
                stopServer(server, logger);
            }, WAIT_BEFORE_SERVER_CLOSE * 1000);
        } else {
            await stopServer(server, logger);
        }
    });
}

async function stopServer(server: MashroomServer, log: MashroomLogger) {
    if (!stopping) {
        stopping = true;
        await server.stop();
    }
}
