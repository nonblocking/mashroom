import {discovery, Configuration as OpenIdClientConfiguration, allowInsecureRequests} from 'openid-client';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {ClientConfiguration} from '../type-definitions';

const CONFIG_REFRESH_TIMEOUT_SEC = 30;

let _config: OpenIdClientConfiguration | null = null;
let _lastConfigRefresh: number | undefined;

export default async (clientConfiguration: ClientConfiguration, devMode: boolean, logger: MashroomLogger): Promise<OpenIdClientConfiguration | null> => {
    const {issuerDiscoveryUrl, issuerMetadata, clientId, clientSecret, httpRequestTimeoutMs} = clientConfiguration;

    if (_config && _lastConfigRefresh && Date.now() - _lastConfigRefresh < CONFIG_REFRESH_TIMEOUT_SEC * 1000) {
        return _config;
    }

    if (issuerDiscoveryUrl) {
        try {
            logger.info(`Setting up OpenID Connect with clientId=${clientId}, discoveryUrl=${issuerDiscoveryUrl}`);
            _config = await discovery(new URL(issuerDiscoveryUrl), clientId, clientSecret, undefined, {
                timeout: httpRequestTimeoutMs / 1000,
                algorithm: clientConfiguration.mode === 'OAuth2' ? 'oauth2' :'oidc',
                execute: devMode ? [allowInsecureRequests] : undefined,
            });

        } catch (e) {
            logger.error(`Connection to service discovery url failed: ${issuerDiscoveryUrl}`, e);
        }
    } else if (issuerMetadata) {
        logger.info(`Setting up OpenID Connect with clientId=${clientId}, metadata=${JSON.stringify(issuerMetadata)}`);
        _config = new OpenIdClientConfiguration(issuerMetadata, clientId, clientSecret);
    }

    _lastConfigRefresh = Date.now();

    return _config;
};
