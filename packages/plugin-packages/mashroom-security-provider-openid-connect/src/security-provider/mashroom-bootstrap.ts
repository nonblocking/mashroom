
import {setCallbackConfiguration, setClientConfiguration} from '../callback/mashroom-openid-connect-callback-route';
import MashroomOpenIDConnectSecurityProvider from './MashroomOpenIDConnectSecurityProvider';
import type {ClientConfiguration} from '../../type-definitions';
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
        extraAuthParams,
        extraDataMapping,
        usePKCE,
        rolesClaimName,
        adminRoles,
        httpRequestTimeoutMs,
    } = pluginConfig;

    const clientConfiguration: ClientConfiguration = {
        mode,
        issuerDiscoveryUrl,
        issuerMetadata,
        clientId,
        clientSecret,
        redirectUrl,
        httpRequestTimeoutMs,
        usePKCE,
    };

    setCallbackConfiguration({
        rolesClaimName,
        adminRoles,
        extraDataMapping,
    });

    setClientConfiguration(clientConfiguration);

    return new MashroomOpenIDConnectSecurityProvider(clientConfiguration, scope, extraAuthParams);
};

export default bootstrap;
