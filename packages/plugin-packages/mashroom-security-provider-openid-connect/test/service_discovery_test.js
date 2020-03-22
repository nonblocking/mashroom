
const { Issuer } = require('openid-client');

async function test() {
    const googleIssuer = await Issuer.discover('https://accounts.google.com/.well-known/openid-configuration');
    console.info('Google issuer metadata: ', googleIssuer.metadata);

    const keycloakTestIssuer = await Issuer.discover('http://localhost:8080/auth/realms/gucci/.well-known/uma2-configuration');
    console.info('Keycloak test realm issuer metadata: ', keycloakTestIssuer.metadata);
}

test();

