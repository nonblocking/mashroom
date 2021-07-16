
import {readFileSync} from 'fs';
import {resolve} from 'path';
import AJV from 'ajv';

const ajv = new AJV({
    strict: true
});

describe('other config validation', () => {

    it('succeeds at a valid ACL config', () => {
        const schema = JSON.parse(readFileSync(resolve(__dirname, '..', 'schemas', 'mashroom-security-acl.json')).toString("utf-8"));
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'other', 'acl.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeTruthy();
    });

    it('succeeds at a valid Topic ACL config', () => {
        const schema = JSON.parse(readFileSync(resolve(__dirname, '..', 'schemas', 'mashroom-security-topic-acl.json')).toString("utf-8"));
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'other', 'topicAcl.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeTruthy();
    });

    it('succeeds at a valid remote app config', () => {
        const schema = JSON.parse(readFileSync(resolve(__dirname, '..', 'schemas', 'mashroom-portal-remote-apps.json')).toString("utf-8"));
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'other', 'remotePortalApps.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeTruthy();
    });

    it('succeeds at a valid users config', () => {
        const schema = JSON.parse(readFileSync(resolve(__dirname, '..', 'schemas', 'mashroom-security-simple-provider-users.json')).toString("utf-8"));
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'other', 'users.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeTruthy();
    });

    it('succeeds at a valid group to roles mapping', () => {
        const schema = JSON.parse(readFileSync(resolve(__dirname, '..', 'schemas', 'mashroom-security-ldap-provider-group-to-role-mapping.json')).toString("utf-8"));
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'other', 'groupToRoleMapping.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeTruthy();
    });

    it('succeeds at a valid user to roles mapping', () => {
        const schema = JSON.parse(readFileSync(resolve(__dirname, '..', 'schemas', 'mashroom-security-ldap-provider-user-to-role-mapping.json')).toString("utf-8"));
        const config = JSON.parse(readFileSync(resolve(__dirname, 'configs', 'other', 'userToRoleMapping.json')).toString("utf-8"));
        const validate = ajv.compile(schema);
        const valid = validate(config);

        expect(valid).toBeTruthy();
    });
});
