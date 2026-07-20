import {authorizationCodeGrant, fetchUserInfo} from 'openid-client';
import {skipSubjectCheck} from 'oauth4webapi';
import determineConfiguration from '../determine-configuration';
import createUser from '../create-user';
import toTokenSet from '../to-token-set';
import saveSession from '../save-session';
import {OICD_AUTH_DATA_SESSION_KEY, OICD_REQUEST_DATA_SESSION_KEY_PREFIX, OICD_USER_SESSION_KEY} from '../constants';

import type {AuthorizationCodeGrantChecks} from 'openid-client';
import type {Request, Response} from 'express';
import type {MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';
import type {
    CallbackConfiguration,
    ClientConfiguration,
    OpenIDConnectAuthData,
    OpenIDConnectAuthRequestData,
} from '../../type-definitions';

let _callbackConfiguration: CallbackConfiguration;
let _clientConfiguration: ClientConfiguration;

export const setCallbackConfiguration = (callbackConfiguration: CallbackConfiguration): void => {
    _callbackConfiguration = callbackConfiguration;
};

export const setClientConfiguration = (clientConfiguration: ClientConfiguration): void => {
    _clientConfiguration = clientConfiguration;
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
        const {loggerFactory, serverInfo: { devMode }} = request.pluginContext;
        const logger = loggerFactory('mashroom.security.provider.openid.connect');

        if (!_callbackConfiguration) {
            response.sendStatus(500);
            return;
        }
        const {rolesClaimName, adminRoles, extraDataMapping} = _callbackConfiguration;

        const openIdClientConfig = await determineConfiguration(_clientConfiguration, devMode, logger);
        if (!openIdClientConfig) {
            response.sendStatus(500);
            return;
        }

        const reqParams = request.query;
        logger.debug('Auth callback called with params:', JSON.stringify(reqParams, null, 2));

        const requestDataKey = `${OICD_REQUEST_DATA_SESSION_KEY_PREFIX}${reqParams.state}`;
        const authReqData: OpenIDConnectAuthRequestData | undefined = request.session[requestDataKey];
        if (!authReqData) {
            logger.error('No ongoing authentication request found in current session. State:', reqParams.state);
            backToStartPage(response, defaultBackUrl);
            return;
        }

        // Delete the auth request data to prevent replays
        delete request.session[requestDataKey];

        const {state, codeVerifier, backUrl} = authReqData;

        const currentURL = new URL(_clientConfiguration.redirectUrl + request.url.substring(1));
        const checks: AuthorizationCodeGrantChecks = {
            pkceCodeVerifier: codeVerifier,
            expectedState: state,
        };

        try {
            let claims;
            let userInfo;
            let tokenResponse = await authorizationCodeGrant(openIdClientConfig, currentURL, checks);
            claims = tokenResponse.claims();
            try {
                userInfo = await fetchUserInfo(openIdClientConfig, tokenResponse.access_token, skipSubjectCheck);
            } catch (e) {
                // Issuer has no userinfo_endpoint
            }

            const tokenSet = toTokenSet(tokenResponse);

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
