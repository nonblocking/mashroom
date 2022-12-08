import openIDConnectClient from '../openid-connect-client';
import createUser from '../create-user';
import saveSession from '../save-session';
import {OICD_REQUEST_DATA_SESSION_KEY_PREFIX, OICD_AUTH_DATA_SESSION_KEY, OICD_USER_SESSION_KEY} from '../constants';
import type {OpenIDCallbackChecks,TokenSet} from 'openid-client';

import type {Request, Response} from 'express';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';
import type {CallbackConfiguration, OpenIDConnectAuthRequestData, OpenIDConnectAuthData} from '../../type-definitions';

let _callbackConfiguration: CallbackConfiguration | undefined;

export const setCallbackConfiguration = (callbackConfiguration: CallbackConfiguration): void => {
    _callbackConfiguration = callbackConfiguration;
};

const backToStartPage = (response: Response, defaultBackUrl: string, backUrl?: string | undefined) => {
    if (backUrl) {
        response.redirect(backUrl);
    } else {
        response.redirect(defaultBackUrl);
    }
};

export default (defaultBackUrl: string) => {
    return async (request: Request, response: Response): Promise<void> => {
        const logger: MashroomLogger = request.pluginContext.loggerFactory('mashroom.security.provider.openid.connect');

        if (!_callbackConfiguration) {
            response.sendStatus(500);
            return;
        }
        const {mode, rolesClaimName, adminRoles, extraDataMapping} = _callbackConfiguration;

        const client = await openIDConnectClient(request);
        if (!client) {
            response.sendStatus(500);
            return;
        }

        const reqParams = client.callbackParams(request);
        logger.debug('Auth callback triggered with params:', reqParams);

        const requestDataKey = `${OICD_REQUEST_DATA_SESSION_KEY_PREFIX}${reqParams.state}`;
        const authReqData: OpenIDConnectAuthRequestData | undefined = request.session[requestDataKey];
        if (!authReqData) {
            logger.error('No ongoing authentication request found in current session. State:', reqParams.state);
            backToStartPage(response, defaultBackUrl);
            return;
        }

        // Delete the auth request data to prevent replays
        delete request.session[requestDataKey];

        const {state, nonce, codeVerifier, backUrl} = authReqData;
        const redirectUrl = client.metadata.redirect_uris && client.metadata.redirect_uris[0];

        const checks: OpenIDCallbackChecks = {
            state,
            nonce,
            code_verifier: codeVerifier,
        };

        try {
            let claims;
            let userInfo;
            let tokenSet: TokenSet;
            if (mode === 'OAuth2') {
                tokenSet = await client.oauthCallback(redirectUrl, reqParams, checks);
            } else {
                tokenSet = await client.callback(redirectUrl, reqParams, checks);
                claims = tokenSet.claims();
                try {
                    userInfo = await client.userinfo(tokenSet);
                } catch (e) {
                    // Issuer has no userinfo_endpoint
                }
            }

            const mashroomUser: MashroomSecurityUser = createUser(claims, userInfo, rolesClaimName, adminRoles, extraDataMapping);
            logger.debug('User successfully authenticated:', mashroomUser);
            logger.debug(`Token valid until: ${new Date((tokenSet.expires_at || 0) * 1000)}. Claims:`, claims, '. User info:', userInfo);

            const authData: OpenIDConnectAuthData = {
                lastTokenCheck: Date.now(),
                tokenSet,
            };
            request.session[OICD_AUTH_DATA_SESSION_KEY] = authData;
            request.session[OICD_USER_SESSION_KEY] = mashroomUser;
            if (request.session.cookie.maxAge && authData?.tokenSet.expires_at && authData.tokenSet.expires_at * 1000 >= Date.now() + request.session.cookie.maxAge) {
                logger.error(`Configuration error detected: The auth token expiration time (${new Date(authData.tokenSet.expires_at * 1000)}) is after the session expiration time (${new Date(Date.now() + request.session.cookie.maxAge)}). Since the token is stored in the session this might lead to unexpected behaviour.`);
            }

            // Make sure the session is in the store before the redirect because it could hit another instance
            await saveSession(request, logger);

            backToStartPage(response, defaultBackUrl, backUrl);

        } catch (e) {
            logger.error('Fetching token failed!', e);
            backToStartPage(response, defaultBackUrl, backUrl);
        }
    };
};
