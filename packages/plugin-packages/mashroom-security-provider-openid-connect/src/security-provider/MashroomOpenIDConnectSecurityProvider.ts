
import fetch from 'node-fetch';
import { generators} from 'openid-client';
import openIDConnectClient from '../openid-connect-client';
import {OICD_AUTH_DATA_SESSION_KEY, OICD_REQUEST_DATA_SESSION_KEY_PREFIX, OICD_USER_SESSION_KEY} from '../constants';
import type {AuthorizationParameters} from 'openid-client';

import type {Request, Response} from 'express';
import type {MashroomLogger,} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomSecurityAuthenticationResult,
    MashroomSecurityLoginResult,
    MashroomSecurityProvider,
    MashroomSecurityUser,
} from '@mashroom/mashroom-security/type-definitions';
import type {OpenIDConnectAuthData, OpenIDConnectAuthRequestData} from '../../type-definitions';

export default class MashroomOpenIDConnectSecurityProvider implements MashroomSecurityProvider {

    constructor(private _scope: string, private _usePKCE: boolean = false, private _extraAuthParams: any = {}) {
    }

    async canAuthenticateWithoutUserInteraction(): Promise<boolean> {
        return false;
    }

    async authenticate(request: Request, response: Response, authenticationHints: any = {}): Promise<MashroomSecurityAuthenticationResult> {
        const logger: MashroomLogger = request.pluginContext.loggerFactory('mashroom.security.provider.openid.connect');
        const {originalUrl} = request;

        logger.debug('Starting new OpenID Connect authentication flow');

        const client = await openIDConnectClient(request);
        if (!client) {
            return {
                status: 'error',
            };
        }

        const authReqData: OpenIDConnectAuthRequestData = {
            state: generators.random(),
            backUrl: originalUrl,
        };
        if (client.metadata.response_types && client.metadata.response_types.includes('id_token')) {
            authReqData.nonce = generators.random();
        }

        let code_challenge = undefined;
        let code_challenge_method = undefined;
        if (this._usePKCE) {
            const code_verifier = generators.codeVerifier();
            authReqData.codeVerifier = code_verifier;
            if (Array.isArray(client.metadata.code_challenge_methods_supported) && client.metadata.code_challenge_methods_supported.includes('S256')) {
                logger.debug('Using PKCE code challenge method: S256');
                code_challenge = generators.codeChallenge(code_verifier);
                code_challenge_method = 'S256';
            } else {
                logger.debug('Using PKCE code challenge method: plain');
                code_challenge = code_verifier;
            }
        }

        const requestDataKey = `${OICD_REQUEST_DATA_SESSION_KEY_PREFIX}${authReqData.state}`;
        request.session[requestDataKey] = authReqData;

        const authorizationParameters: AuthorizationParameters = {
            scope: this._scope,
            state: authReqData.state,
            nonce: authReqData.nonce,
            code_challenge,
            code_challenge_method,
            ...this._extraAuthParams,
            ...authenticationHints,
        };

        const authorizationUrl = client.authorizationUrl(authorizationParameters);
        logger.debug('Redirecting to:', authorizationUrl);

        response.redirect(authorizationUrl);

        return {
            status: 'deferred',
        };
    }

    async checkAuthentication(request: Request): Promise<void> {
        const logger: MashroomLogger = request.pluginContext.loggerFactory('mashroom.security.provider.openid.connect');

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
            const client = await openIDConnectClient(request);
            if (!client) {
                return;
            }

            const newTokenSet = await client.refresh(refreshToken);
            authData.lastTokenCheck = Date.now();
            authData.tokenSet = newTokenSet;
            if (!authData.tokenSet.refresh_token) {
                // Keep refresh token
                authData.tokenSet.refresh_token = refreshToken;
            }
            request.session[OICD_AUTH_DATA_SESSION_KEY] = authData;

            try {
                const userInfo = await client.userinfo(newTokenSet);
                logger.info('NEW USER INFO', userInfo);
            } catch (error) {
                logger.error('Test', error);
            }

            user = this.getUser(request);
            logger.debug(`Token refreshed for user ${user?.username}. Valid until: ${new Date((newTokenSet.expires_at || 0) * 1000)}. Claims:`);

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
        const logger: MashroomLogger = request.pluginContext.loggerFactory('mashroom.security.provider.openid.connect');

        const client = await openIDConnectClient(request);
        const authData: OpenIDConnectAuthData | undefined = request.session[OICD_AUTH_DATA_SESSION_KEY];
        if (!client || !authData?.tokenSet) {
            return;
        }

        delete request.session[OICD_USER_SESSION_KEY];
        delete request.session[OICD_AUTH_DATA_SESSION_KEY];

        try {
            logger.debug('Revoking identity provider session');
            const endSessionUrl = client.endSessionUrl({
                id_token_hint: authData.tokenSet.id_token,
            });

            await fetch(endSessionUrl);
        } catch (e) {
            logger.error('Revoking identity provider session failed!', e);
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
