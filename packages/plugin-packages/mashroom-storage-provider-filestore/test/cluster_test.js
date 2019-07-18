/* eslint no-console: off */

const cluster = require('cluster');
const path = require('path');
const fs = require('fs');
const MashroomStorageFilestore = require('../dist/storage/MashroomStorageFilestore').default;

const INSERTS_PER_CLUSTER = 1000;
const WORKER_COUNT = 3;

const dataFolder = path.resolve(__dirname, './test-data');

const dummyLogger = {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: (m, e) => { console.error(process.pid, m, e); },
};

async function test() {
    const storage = new MashroomStorageFilestore(dataFolder, () => dummyLogger);
    const collection = await storage.getCollection('cluster-test');

    for (let i = 0; i < INSERTS_PER_CLUSTER; i++) {
        const start = Date.now();
        try {
            await collection.insertOne({w: process.pid, i});
        } catch (e) {
            console.info('Error after ms: ' + (Date.now() - start), process.pid);
            console.error(e);
        }
    }

    setTimeout(() => {
        collection.find().then((items) => {
            const count = items.length;
            console.log(`Worker ${process.pid} got items in collection: ${count}. Expected: ${INSERTS_PER_CLUSTER * WORKER_COUNT}`);
            console.info('RESULT: ' + (count === INSERTS_PER_CLUSTER * WORKER_COUNT ? 'OK' : 'NOK!'));
            process.exit();
        });
    }, 5000);
}

if (cluster.isMaster) {

    try {
        fs.unlinkSync(path.resolve(dataFolder, 'cluster-test.json'), () => {});
    } catch (e) {
        // Ignore
    }

    for (let i = 0; i < WORKER_COUNT; i++) {
        cluster.fork();
    }
} else {
    console.log(`Worker ${process.pid} started`);
    test();
}
