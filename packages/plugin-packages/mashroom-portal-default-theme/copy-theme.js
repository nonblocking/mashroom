
const {resolve} = require('path');

async function copy() {
    const cpy = (await import('cpy')).default;

    const targetThemeFolder = resolve('..', process.argv[2]);

    console.info('Copying default theme from:', targetThemeFolder);

    await cpy(`${targetThemeFolder}/dist/**/*`, `${__dirname}/dist`);
    await cpy(`${targetThemeFolder}/views/**/*`, `${__dirname}/views`);
}

copy();
