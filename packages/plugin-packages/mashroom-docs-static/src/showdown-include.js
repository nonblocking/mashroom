
const path = require('path');
const fs = require('fs');
const showdown = require('showdown');

showdown.extension('showdown-include', () => {
    'use strict';
    return {
        type: 'lang', //or output
        filter: (text, converter, options) => {

            return text
                .split('\n')
                .map((line) => {
                    if (line.indexOf('[inc]') !== -1) {
                        // TODO
                        const match = line.match(/\((.+md)\)/);
                        if (match.length === 2) {
                            const include = match[1];
                            const file = path.resolve(__dirname, '../docs', include);
                            console.info('Including file: ', file);
                            if (fs.existsSync(file)) {
                                return fs.readFileSync(file, 'utf8');
                            } else {
                                console.error('File does not exist: ', file);
                            }
                        }
                    }
                    return line;
                })
                .join('\n');
        }
    };
});
