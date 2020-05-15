import openIDConnectClient from '../openid-connect-client';
import createUser from '../create-user';
import {OICD_AUTH_DATA_SESSION_KEY, OICD_USER_SESSION_KEY} from '../constants';
import {OpenIDCallbackChecks} from 'openid-client';

import type {ExpressResponse, MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';
import type {CallbackConfiguration, ExpressRequestWithSession, OpenIDConnectAuthData} from '../../type-definitions';

let _callbackConfiguration: CallbackConfiguration | undefined;

export const setCallbackConfiguration = (callbackConfiguration: CallbackConfiguration) => {
    _callbackConfiguration = callbackConfiguration;
};

export default (defaultBackUrl: string) => {
    return async (request: ExpressRequestWithSession, response: ExpressResponse) => {
        const logger: MashroomLogger = request.pluginContext.loggerFactory('mashroom.security.provider.openid.connect');

        if (!_callbackConfiguration) {
            response.sendStatus(500);
            return;
        }
        const {mode, rolesClaimName, adminRoles} = _callbackConfiguration;

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
            let claims;
            let userInfo;
            if (mode === 'OAuth2') {
                const tokenSet = await client.oauthCallback(redirectUrl, reqParams, checks);

                authData.lastTokenCheck = Date.now();
                authData.tokenSet = tokenSet;

            } else {
                const tokenSet = await client.callback(redirectUrl, reqParams, checks);
                claims = tokenSet.claims();
                try {
                    userInfo = await client.userinfo(tokenSet);
                } catch (e) {
                    // Issuer has no userinfo_endpoint
                }

                authData.lastTokenCheck = Date.now();
                authData.tokenSet = tokenSet;
            }

            const mashroomUser: MashroomSecurityUser = createUser(claims, userInfo, rolesClaimName, adminRoles);
            logger.debug('User successfully authenticated:', mashroomUser);
            logger.debug(`Token valid until: ${new Date((authData.tokenSet.expires_at || 0) * 1000)}. Claims:`, claims, '. User info:', userInfo);

            request.session[OICD_AUTH_DATA_SESSION_KEY] = authData;
            request.session[OICD_USER_SESSION_KEY] = mashroomUser;

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
