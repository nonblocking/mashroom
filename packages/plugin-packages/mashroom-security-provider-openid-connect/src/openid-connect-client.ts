
import {Client, Issuer} from "openid-client";

import {ClientConfiguration, ExpressRequestWithSession} from "../type-definitions";
import {MashroomLogger} from "@mashroom/mashroom/type-definitions";

let _clientConfiguration: ClientConfiguration | undefined;
const _callbackBasePath = '/openid-connect-cb';
let _client: Client | undefined;

export const setClientConfiguration = (clientConfiguration: ClientConfiguration) => {
    _clientConfiguration = clientConfiguration;
    _client = undefined;
};

export default async (request: ExpressRequestWithSession): Promise<Client | undefined> => {
    const logger: MashroomLogger = request.pluginContext.loggerFactory('mashroom.security.provider.openid.connect');

    if (_client) {
        return _client;
    }
    if (!_clientConfiguration) {
        throw new Error('Cannot create OpenID Connect client because no configuration given!');
    }

    const { discoveryUrl, clientId, clientSecret, redirectUrl, responseType } = _clientConfiguration;

    logger.info(`Setting up OpenID Connect with clientId=${clientId}, responseType=${responseType}, redirectUrl=${redirectUrl}, discoveryUrl=${discoveryUrl}`);

    let issuer;
    try {
        issuer = await Issuer.discover(discoveryUrl);
    } catch (e) {
        logger.error(`Connection to service discovery url failed: ${discoveryUrl}`, e);
        return undefined;
    }

    logger.info('Issuer data:', issuer.metadata);

    if (Array.isArray(issuer.metadata.response_types_supported)) {
        const supportedResponseTypes: Array<string> = issuer.metadata.response_types_supported;
        if (supportedResponseTypes.indexOf(responseType) === -1) {
            logger.error(`Response type ${responseType} not supported! Supported are: ${supportedResponseTypes}`);
            return undefined;
        }
    }

    let client;
    try {
        client = new issuer.Client({
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uris: [redirectUrl],
            response_types: [responseType],
        });
    } catch (e) {
        logger.error('Client creation failed!', e);
        return undefined;
    }

    _client = client;
    return client;
}
