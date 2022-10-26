const {resolve} = require('path');
const cpy = require('cpy');
const del = require('del');

const distFolder = resolve(__dirname, 'tmp');

(async () => {
    console.info('Cleaning up...');
    await del([distFolder])

    console.info('Copying files...');
    await cpy([
        '**/package*.json',
        '**/index.js',
        '**/mashroom.json',
        '**/dist/**',
        '**/lib/**',
        '**/public/**',
        '**/messages/**',
        '**/layouts/**',
        '**/views/**',
        '**/assets/**',
        "lerna.json",
        '**/test-server6/**',
        '!**/node_modules',
        '!**/test-data',
        '!**/log',
        '!**/type-definitions/**',
        '!**/test-server1',
        '!**/test-server2',
        '!**/test-server3',
        '!**/test-server4',
        '!**/test-server5',
    ], 'packages/test/test-server6/kubernetes/portal/tmp', {
        cwd: '../../../../..',
        overwrite: true,
        parents: true,
    });
})();
