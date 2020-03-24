
import {setClientConfiguration} from '../openid-connect-client';
import MashroomOpenIDConnectSecurityProvider from './MashroomOpenIDConnectSecurityProvider';
import {MashroomSecurityProviderPluginBootstrapFunction} from '@mashroom/mashroom-security/type-definitions';

const bootstrap: MashroomSecurityProviderPluginBootstrapFunction = async (pluginName, pluginConfig) => {
    const {
        mode,
        issuerDiscoveryUrl,
        issuerMetadata,
        scope,
        clientId,
        clientSecret,
        redirectUrl,
        responseType,
        extraAuthParams,
        usePKCE,
        rolesClaimName,
        adminRoles,
    } = pluginConfig;

    setClientConfiguration({
        mode,
        issuerDiscoveryUrl,
        issuerMetadata,
        clientId,
        clientSecret,
        redirectUrl,
        responseType,
    });

    return new MashroomOpenIDConnectSecurityProvider(scope, usePKCE, extraAuthParams, rolesClaimName, adminRoles);
};

export default bootstrap;
