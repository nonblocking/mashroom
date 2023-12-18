
const { writeFileSync, readdirSync } = require('fs');
const { resolve } = require('path');
const { compileFromFile } = require('json-schema-to-typescript');

const schemaDir = resolve(__dirname, 'schemas');
const outDir = resolve(__dirname, 'type-definitions');

const IGNORE_SCHEMAS = ['mashroom-packagejson-extension.json'];

readdirSync(schemaDir)
    .filter((file) => file.endsWith('json'))
    .filter((schemaFile) => IGNORE_SCHEMAS.indexOf(schemaFile) === -1)
    .forEach((schemaFile) => {
        console.info('Generating types for:', schemaFile);
        compileFromFile(resolve(schemaDir, schemaFile), {
            unknownAny: false,
            strictIndexSignatures: true,
            additionalProperties: false,
            cwd: schemaDir,
        }).then(ts => {
            writeFileSync(resolve(outDir, schemaFile.split('.')[0] + '.d.ts'), ts);
        });
    });
