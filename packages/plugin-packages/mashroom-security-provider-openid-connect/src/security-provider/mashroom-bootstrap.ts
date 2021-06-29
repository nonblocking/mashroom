
import {setClientConfiguration} from '../openid-connect-client';
import {setCallbackConfiguration} from '../callback/mashroom-openid-connect-callback-route';
import MashroomOpenIDConnectSecurityProvider from './MashroomOpenIDConnectSecurityProvider';
import type {MashroomSecurityProviderPluginBootstrapFunction} from '@mashroom/mashroom-security/type-definitions';

const bootstrap: MashroomSecurityProviderPluginBootstrapFunction = async (pluginName, pluginConfig) => {
    const {
        mode,
        issuerDiscoveryUrl,
        issuerMetadata,
        rejectUnauthorized,
        scope,
        clientId,
        clientSecret,
        redirectUrl,
        responseType,
        extraAuthParams,
        usePKCE,
        rolesClaimName,
        adminRoles,
        httpRequestTimeout,
    } = pluginConfig;

    setClientConfiguration({
        issuerDiscoveryUrl,
        issuerMetadata,
        rejectUnauthorized,
        clientId,
        clientSecret,
        redirectUrl,
        responseType,
        httpRequestTimeout,
    });

    setCallbackConfiguration({
        mode,
        rolesClaimName,
        adminRoles,
    });

    return new MashroomOpenIDConnectSecurityProvider(scope, usePKCE, extraAuthParams, rejectUnauthorized);
};

export default bootstrap;
