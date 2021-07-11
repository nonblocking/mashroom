
import {readFileSync} from 'fs';
import {resolve} from 'path';
import AJV from 'ajv';

const ajv = new AJV();

const schema = JSON.parse(readFileSync(resolve(__dirname, '..', 'schemas', 'mashroom-plugins.json')).toString("utf-8"));

// TODO: api, middleware, static, services, admin-ui-integration, background-job, http-proxy-interceptor, memory-cache-provider,
//       external-messaging-provider, portal-app, portal-theme, portal-layouts, portal-app-enhancement, portal-page-enhancement,
//       remote-portal-app-registry, security-provider, session-store-provider, storage-provider

describe('plugin config validation', () => {

    it('succeeds at a valid plugin-loader config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'plugins', 'plugin-loader.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeTruthy();
    });

    it('fails at an invalid plugin-loader config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'plugins', 'plugin-loader2.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeFalsy();
    });

    it('succeeds at a valid web-app config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'plugins', 'web-app.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeTruthy();
    });

    it('fails at an invalid web-app config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'plugins', 'web-app2.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeFalsy();
    });


});
