
const LdapClientImpl = require('../../../plugin-packages/mashroom-security-provider-ldap/dist/LdapClientImpl').default;
const MashroomLdapSecurityProvider = require('../../../plugin-packages/mashroom-security-provider-ldap/dist/MashroomLdapSecurityProvider').default;

const ldapClient = new LdapClientImpl('ldap://localhost:1389', 2000, 2000,
    'ou=users,dc=nonblocking,dc=at', 'uid=mashroom,ou=applications,dc=nonblocking,dc=at', 'mashroom',
    null, () => console);

const securityProvider = new MashroomLdapSecurityProvider(
    '/login', '(&(objectClass=person)(uid=@username@))', '(objectClass=groupOfNames)', '../groupToRoleMapping.json',
    ldapClient, './', 1200, () => console);

const request = {
    session: {},
    pluginContext: {
        loggerFactory: () => console
    }
};

async function start() {
    const result = await securityProvider.login(request, 'john', 'john');
    console.info('RESULT', result);
    console.info('SESSION', request.session);
    ldapClient.shutdown();
}

start();




