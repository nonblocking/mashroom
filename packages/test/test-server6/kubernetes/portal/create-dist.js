const {tmpdir} = require('os');
const {resolve} = require('path');
const {copySync, emptyDirSync} = require('fs-extra');

const sourceFolder = resolve(__dirname, '../../../../..');
const tmpDistFolder = resolve(tmpdir(), 'mashroom-test-server6-portal-dist');
const distFolder = resolve(__dirname, 'tmp');

(async () => {
    console.info('Cleaning up...');
    await emptyDirSync(tmpDistFolder)
    await emptyDirSync(distFolder)

    console.info('Copying files to temp folder: ', tmpDistFolder);

    copySync(sourceFolder, tmpDistFolder, {
       filter: (src, dest) => {
           if (src.endsWith('/packages/test')) {
               return true;
           }
           if (['/src', '/node_modules', '/.nx', '/.github', '/.idea', '/test', '/test-data', '/test-reports',
               '/log', '/tmp', '/logos','/type-definitions', '.md', '.editorconfig', '.gitignore',
               '/test-server1', '/test-server2', '/test-server3', '/test-server4', '/test-server5', '/test-server6/kubernetes',
               '/test-server7', '/test-server8'].some(p => src.endsWith(p))) {
               return false;
           }

           return true;
       },
    });

    console.info('Copying files to dist folder: ', distFolder);
    copySync(tmpDistFolder, distFolder)
})();
