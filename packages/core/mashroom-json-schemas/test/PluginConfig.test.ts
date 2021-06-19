
import {readFileSync} from 'fs';
import {resolve} from 'path';
import AJV from 'ajv';

const ajv = new AJV();

const schema = JSON.parse(readFileSync(resolve(__dirname, '..', 'schemas', 'mashroom-plugin-package.json')).toString("utf-8"));

describe('plugin config validation', () => {

    it('validates a valid plugin-loader config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'plugins', 'plugin-loader.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeTruthy();
    });

    it('validates an invalid plugin-loader config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'plugins', 'plugin-loader2.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeFalsy();
    });

    it('validates a valid web-app config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'plugins', 'web-app.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        console.error(validate.errors);
        expect(valid).toBeTruthy();
    });

    it('validates an invalid web-app config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'plugins', 'web-app2.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeFalsy();
    });


});
