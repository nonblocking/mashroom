
import {readFileSync} from 'fs';
import {resolve} from 'path';
import AJV from 'ajv';

const ajv = new AJV();

const schema = JSON.parse(readFileSync(resolve(__dirname, '..', 'schemas', 'mashroom-server-config.json')).toString("utf-8"));

describe('server config validation', () => {

    it('validates a valid config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'server', 'mashroom1.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeTruthy();
    });

    it('validates an invalid config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'server', 'mashroom2.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeFalsy();
    });
});
