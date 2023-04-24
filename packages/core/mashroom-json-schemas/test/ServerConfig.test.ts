
import {readFileSync} from 'fs';
import {resolve} from 'path';
import AJV from 'ajv';

const ajv = new AJV({
    strict: true
});
ajv.addKeyword('deprecationMessage');

const schema = JSON.parse(readFileSync(resolve(__dirname, '..', 'schemas', 'mashroom-server-config.json')).toString("utf-8"));

describe('server config validation', () => {

    it('succeeds at a valid Mashroom server config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'server', 'mashroom1.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        // console.error(validate.errors);

        expect(valid).toBeTruthy();
    });

    it('fails at an invalid Mashroom server config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'server', 'mashroom2.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeFalsy();
    });
});
