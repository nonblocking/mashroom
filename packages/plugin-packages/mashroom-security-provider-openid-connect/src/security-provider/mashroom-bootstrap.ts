
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
        extraDataMapping,
        usePKCE,
        rolesClaimName,
        adminRoles,
        httpRequestTimeoutMs,
    } = pluginConfig;

    setClientConfiguration({
        issuerDiscoveryUrl,
        issuerMetadata,
        clientId,
        clientSecret,
        redirectUrl,
        responseType,
        httpRequestTimeoutMs,
    });

    setCallbackConfiguration({
        mode,
        rolesClaimName,
        adminRoles,
        extraDataMapping,
    });

    return new MashroomOpenIDConnectSecurityProvider(scope, usePKCE, extraAuthParams);
};

export default bootstrap;
