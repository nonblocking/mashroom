
import openIDConnectClient, {getMode} from '../openid-connect-client';
import {OICD_AUTH_DATA_SESSION_KEY} from '../constants';

import {ExpressResponse, MashroomLogger} from '@mashroom/mashroom/type-definitions';
import {ExpressRequestWithSession, OpenIDConnectAuthData} from "../../type-definitions";
import {OpenIDCallbackChecks} from "openid-client";

export default (defaultBackUrl: string) => {
    return async (request: ExpressRequestWithSession, response: ExpressResponse) => {
        const logger: MashroomLogger = request.pluginContext.loggerFactory('mashroom.security.provider.openid.connect');

        const client = await openIDConnectClient(request);
        if (!client) {
            response.sendStatus(403);
            return;
        }

        const reqParams = client.callbackParams(request);
        logger.debug('Auth callback triggered with params:', reqParams);

        const authData: OpenIDConnectAuthData = request.session[OICD_AUTH_DATA_SESSION_KEY];
        const {state, nonce, codeVerifier, backUrl} = authData;

        // Remove sensitive data from session that is no longer required
        delete authData.state;
        delete authData.nonce;
        delete authData.codeVerifier;
        request.session[OICD_AUTH_DATA_SESSION_KEY] = authData;

        const redirectUrl = client.metadata.redirect_uris && client.metadata.redirect_uris[0];

        const checks: OpenIDCallbackChecks = {
            state,
            nonce,
            code_verifier: codeVerifier,
        };

        try {
            if (getMode() === 'OAuth2') {
                const tokenSet = await client.oauthCallback(redirectUrl, reqParams, checks);

                console.debug(`Successfully authorized user. Token valid until: ${new Date((tokenSet.expires_at || 0) * 1000)}`);

                authData.lastTokenCheck = Date.now();
                authData.tokenSet = tokenSet;

            } else {
                const tokenSet = await client.callback(redirectUrl, reqParams, checks);
                const claims = tokenSet.claims();

                console.debug(`Successfully authenticated user ${claims.preferred_username}. Token valid until: ${new Date((tokenSet.expires_at || 0) * 1000)}. Claims:`, claims);

                authData.lastTokenCheck = Date.now();
                authData.tokenSet = tokenSet;
                authData.claims = claims;
            }

            request.session[OICD_AUTH_DATA_SESSION_KEY] = authData;

            if (backUrl) {
                response.redirect(backUrl);
            } else {
                response.redirect(defaultBackUrl);
            }

        } catch (e) {
            logger.error('Fetching token failed!', e);
            response.sendStatus(403);
        }
    };
}
