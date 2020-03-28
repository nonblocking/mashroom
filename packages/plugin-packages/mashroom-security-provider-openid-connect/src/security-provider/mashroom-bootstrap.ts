
import {setClientConfiguration} from '../openid-connect-client';
import {setCallbackConfiguration} from '../callback/mashroom-openid-connect-callback-route';
import MashroomOpenIDConnectSecurityProvider from './MashroomOpenIDConnectSecurityProvider';
import type {MashroomSecurityProviderPluginBootstrapFunction} from '@mashroom/mashroom-security/type-definitions';

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
        issuerDiscoveryUrl,
        issuerMetadata,
        clientId,
        clientSecret,
        redirectUrl,
        responseType,
    });

    setCallbackConfiguration({
        mode,
        rolesClaimName,
        adminRoles,
    });

    return new MashroomOpenIDConnectSecurityProvider(scope, usePKCE, extraAuthParams);
};

export default bootstrap;
