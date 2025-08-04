
import {readFileSync} from 'fs';
import {resolve} from 'path';
import AJV from 'ajv';

const ajv = new AJV({
    strict: true
});

const schema = JSON.parse(readFileSync(resolve(__dirname, '..', 'schemas', 'mashroom-plugins.json')).toString("utf-8"));

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

    it('succeeds at a valid api config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'plugins', 'api.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeTruthy();
    });

    it('succeeds at a valid middleware config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'plugins', 'middleware.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeTruthy();
    });

    it('succeeds at a valid static config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'plugins', 'static.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeTruthy();
    });

    it('succeeds at a valid services config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'plugins', 'services.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeTruthy();
    });

    it('fails at a invalid services config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'plugins', 'services2.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeFalsy();
    });

    it('succeeds at a valid admin-ui-integration config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'plugins', 'admin-ui-integration.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        // console.error(validate.errors);

        expect(valid).toBeTruthy();
    });

    it('succeeds at a valid background-job config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'plugins', 'background-job.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeTruthy();
    });

    it('succeeds at a valid http-proxy-interceptor config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'plugins', 'http-proxy-interceptor.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeTruthy();
    });

    it('succeeds at a valid memory-cache-provider config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'plugins', 'memory-cache-provider.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeTruthy();
    });

    it('succeeds at a valid external-messaging-provider config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'plugins', 'external-messaging-provider.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeTruthy();
    });

    it('succeeds at a valid portal-app config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'plugins', 'portal-app.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeTruthy();
    });

    it('fails at a valid portal-app config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'plugins', 'portal-app3.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeFalsy();
    });

    it('succeeds at a valid portal-app v2 config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'plugins', 'portal-app4.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeTruthy();
    });

    it('succeeds at a valid portal-theme config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'plugins', 'portal-theme.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeTruthy();
    });

    it('succeeds at a valid portal-layouts config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'plugins', 'portal-layouts.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeTruthy();
    });

    it('succeeds at a valid portal-app-enhancement config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'plugins', 'portal-app-enhancement.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeTruthy();
    });

    it('succeeds at a valid portal-page-enhancement config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'plugins', 'portal-page-enhancement.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeTruthy();
    });

    it('succeeds at a valid security-provider config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'plugins', 'security-provider.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeTruthy();
    });

    it('succeeds at a valid  session-store-provider config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'plugins', 'session-store-provider.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeTruthy();
    });

    it('succeeds at a valid storage-provider config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'plugins', 'storage-provider.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeTruthy();
    });

    it('succeeds at a custom plugin config', () => {
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'plugins', 'custom-plugin.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeTruthy();
    });

});
