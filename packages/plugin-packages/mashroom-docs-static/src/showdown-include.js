
const path = require('path');
const fs = require('fs');
const showdown = require('showdown');

const MIN_HEADER_LEVEL = 3;
const HEADER_REGEX = /^([#]+)/;

const getAndProcessInclude = (file) => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    let addHeaderIndentation = null;
    return lines.map(line => {
        const match = line.match(HEADER_REGEX);
        if (match) {
            if (addHeaderIndentation === null) {
                addHeaderIndentation = MIN_HEADER_LEVEL - match[0].length;
                if (addHeaderIndentation > 0) {
                    console.info('Adding header indentation:', addHeaderIndentation)
                }
            }
            if (addHeaderIndentation) {
                line = ''.padStart(addHeaderIndentation, '#') + line;
            }
        }
        return line;
    }).join('\n');
};

showdown.extension('showdown-include', () => {
    'use strict';
    return {
        type: 'lang', //or output
        filter: (text, converter, options) => {

            return text
                .split('\n')
                .map((line) => {
                    if (line.indexOf('[inc]') !== -1) {
                        const match = line.match(/\((.+md)\)/);
                        if (match.length === 2) {
                            const include = match[1];
                            const file = path.resolve(__dirname, '../docs', include);
                            console.info('Including file: ', file);
                            if (fs.existsSync(file)) {
                                return getAndProcessInclude(file);
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
