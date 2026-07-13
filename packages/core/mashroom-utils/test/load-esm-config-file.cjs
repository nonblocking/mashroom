const {resolve} = require('path');
const {loadConfigFile} = require('../lib/config-file-utils');

const test = async () => {
    const config1 = await loadConfigFile(resolve(__dirname, 'data/mashroom.mjs'));
    console.info('ESM:', config1);
    const config2 = await loadConfigFile(resolve(__dirname, 'data/mashroom.ts'));
    console.info('TS:', config2);
};

test();

