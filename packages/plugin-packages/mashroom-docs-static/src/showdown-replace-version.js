
const path = require('path');
const showdown = require('showdown');

const serverPackageJson = require(path.resolve(__dirname, '../../../core/mashroom/package.json'));

showdown.extension('showdown-replace-version', () => {
    'use strict';
    return {
        type: 'lang', //or output
        filter: (text, converter, options) => {

            return text.replace(/\[version\]/, serverPackageJson.version);
        }
    };
});
