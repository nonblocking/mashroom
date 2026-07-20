
import { buildAuthorizationUrl, randomPKCECodeVerifier, calculatePKCECodeChallenge, randomState, refreshTokenGrant, tokenRevocation} from 'openid-client';
import toTokenSet from '../to-token-set';
import saveSession from '../save-session';
import {OICD_AUTH_DATA_SESSION_KEY, OICD_REQUEST_DATA_SESSION_KEY_PREFIX, OICD_USER_SESSION_KEY} from '../constants';
import determineConfiguration from '../determine-configuration';

import type {Request, Response} from 'express';
import type {
    MashroomSecurityAuthenticationResult,
    MashroomSecurityLoginResult,
    MashroomSecurityProvider,
    MashroomSecurityUser,
} from '@mashroom/mashroom-security/type-definitions';
import type {ClientConfiguration, OpenIDConnectAuthData, OpenIDConnectAuthRequestData} from '../../type-definitions';

export default class MashroomOpenIDConnectSecurityProvider implements MashroomSecurityProvider {

    constructor(private _clientConfiguration: ClientConfiguration, private _scope: string, private _extraAuthParams: any = {}) {
    }

    async canAuthenticateWithoutUserInteraction(): Promise<boolean> {
        return false;
    }

    async authenticate(request: Request, response: Response, authenticationHints: any = {}): Promise<MashroomSecurityAuthenticationResult> {
        const {loggerFactory, serverInfo: { devMode }} = request.pluginContext;
        const logger = loggerFactory('mashroom.security.provider.openid.connect');
        const {originalUrl} = request;

        logger.debug('Starting new OpenID Connect authentication flow');

        const openIdClientConfig = await determineConfiguration(this._clientConfiguration, devMode, logger);
        if (!openIdClientConfig) {
            return {
                status: 'error',
            };
        }

        const serverMetadata = openIdClientConfig.serverMetadata();

        const authReqData: OpenIDConnectAuthRequestData = {
            state: randomState(),
            backUrl: originalUrl,
        };

        const authorizationParameters: Record<string, string> = {
            redirect_uri: this._clientConfiguration.redirectUrl,
            scope: this._scope,
            state: authReqData.state,
            ...this._extraAuthParams,
            ...authenticationHints,
        };

        let code_challenge = undefined;
        let code_challenge_method = undefined;
        if (this._clientConfiguration.usePKCE) {
            const code_verifier = randomPKCECodeVerifier();
            authReqData.codeVerifier = code_verifier;
            if (serverMetadata.code_challenge_methods_supported?.includes('S256')) {
                logger.debug('Using PKCE code challenge method: S256');
                code_challenge = await calculatePKCECodeChallenge(code_verifier);
                code_challenge_method = 'S256';
                authorizationParameters.code_challenge = code_challenge;
                authorizationParameters.code_challenge_method = code_challenge_method;
            } else {
                logger.debug('Using PKCE code challenge method: plain');
                authorizationParameters.code_challenge = code_verifier;
            }
        }

        const requestDataKey = `${OICD_REQUEST_DATA_SESSION_KEY_PREFIX}${authReqData.state}`;
        request.session[requestDataKey] = authReqData;

        // Make sure the session is in the store because the IDP could redirect back very quickly
        await saveSession(request, logger);

        const authorizationUrl = buildAuthorizationUrl(openIdClientConfig, authorizationParameters);
        logger.debug('Redirecting to:', authorizationUrl);

        response.redirect(authorizationUrl.toString());

        return {
            status: 'deferred',
        };
    }

    async checkAuthentication(request: Request): Promise<void> {
        const {loggerFactory, serverInfo: { devMode }} = request.pluginContext;
        const logger = loggerFactory('mashroom.security.provider.openid.connect');

        let user = this.getUser(request);
        const authData: OpenIDConnectAuthData | undefined = request.session[OICD_AUTH_DATA_SESSION_KEY];
        if (!authData) {
            return;
        }

        if (!this.shouldRefreshToken(authData)) {
            return;
        }

        const refreshToken = authData.tokenSet.refresh_token;
        if (!refreshToken) {
            logger.warn(`No refresh token given. Authentication will expire at ${new Date((authData.tokenSet.expires_at || 0) * 1000)} and cannot be extended`);
            return;
        }

        try {
            const openIdClientConfig = await determineConfiguration(this._clientConfiguration, devMode, logger);
            if (!openIdClientConfig) {
                return;
            }

            const refreshResponse = await refreshTokenGrant(openIdClientConfig, refreshToken);
            authData.lastTokenCheck = Date.now();
            authData.tokenSet = toTokenSet(refreshResponse);
            if (!authData.tokenSet.refresh_token) {
                // Keep refresh token
                authData.tokenSet.refresh_token = refreshToken;
            }
            request.session[OICD_AUTH_DATA_SESSION_KEY] = authData;

            // Make sure the session so subsequent request don't trigger a new refresh
            await saveSession(request, logger);

            user = this.getUser(request);
            logger.debug(`Token refreshed for user ${user?.username}. Valid until: ${new Date((authData.tokenSet.expires_at || 0) * 1000)}. Claims:`);

        } catch (e) {
            logger.info(`Refreshing token failed. Signing out user: ${user?.username}`, e);
            delete request.session[OICD_AUTH_DATA_SESSION_KEY];
        }
    }

    getAuthenticationExpiration(request: Request): number | null | undefined {
        const authData: OpenIDConnectAuthData | undefined = request.session[OICD_AUTH_DATA_SESSION_KEY];
        if (authData?.tokenSet.expires_at) {
            return authData.tokenSet.expires_at * 1000;
        }

        return undefined;
    }

    async revokeAuthentication(request: Request): Promise<void> {
        const {loggerFactory, serverInfo: { devMode }} = request.pluginContext;
        const logger = loggerFactory('mashroom.security.provider.openid.connect');

        const openIdClientConfig = await determineConfiguration(this._clientConfiguration, devMode, logger);
        const authData: OpenIDConnectAuthData | undefined = request.session[OICD_AUTH_DATA_SESSION_KEY];
        if (!openIdClientConfig || !authData?.tokenSet) {
            return;
        }

        delete request.session[OICD_USER_SESSION_KEY];
        delete request.session[OICD_AUTH_DATA_SESSION_KEY];

        const abortController = new AbortController();
        const abortTimeout = setTimeout(() => abortController.abort(), 2000);
        try {
            logger.debug('Revoking identity provider session');
            await tokenRevocation(openIdClientConfig, authData.tokenSet.access_token);
        } catch (e) {
            logger.error('Revoking identity provider session failed!', e);
        } finally {
            clearTimeout(abortTimeout);
        }
    }

    async login(): Promise<MashroomSecurityLoginResult> {
        return {
            success: false,
            failureReason: 'Login not supported'
        };
    }

    getUser(request: Request): MashroomSecurityUser | null {
        if (!request.session) {
            return null;
        }
        const user: MashroomSecurityUser | undefined = request.session[OICD_USER_SESSION_KEY];
        const authData: OpenIDConnectAuthData | undefined = request.session[OICD_AUTH_DATA_SESSION_KEY];

        if (!user || !authData || !authData.tokenSet) {
            return null;
        }

        if (authData.tokenSet.expires_at && authData.tokenSet.expires_at * 1000 < Date.now()) {
            return null;
        }

        return {
            ...user,
            secrets: {
                accessToken: authData.tokenSet.access_token,
                idToken: authData.tokenSet.id_token,
            },
        };
    }

    /*
     * We need to refresh the token periodically, otherwise the session would just expire after some time
     * To avoid too much load at the Identity Provider we do that only from time to time, when a third of the
     * expiration time (which is usually a few minutes) has elapsed
     */
    private shouldRefreshToken(authData: OpenIDConnectAuthData): boolean {
        const {lastTokenCheck, tokenSet: {expires_at} = {}} = authData;
        let checkPeriod;
        if (!expires_at) {
            // If the token doesn't expire, check it every 30sec
            checkPeriod = 30000;
        } else {
            checkPeriod = (expires_at * 1000 - lastTokenCheck) / 3;
        }

        return Date.now() - lastTokenCheck > checkPeriod;
    }
}
