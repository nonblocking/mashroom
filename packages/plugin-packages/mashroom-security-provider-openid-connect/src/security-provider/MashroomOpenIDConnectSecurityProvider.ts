
import requestNative from 'request-promise-native';
import {AuthorizationParameters, generators} from "openid-client";
import openIDConnectClient from '../openid-connect-client';
import {
    OICD_AUTH_DATA_SESSION_KEY,
    OICD_USER_SESSION_KEY,
    TOKEN_CHECK_INTERVAL_MS,
} from '../constants';

import type {
    MashroomSecurityAuthenticationResult,
    MashroomSecurityLoginResult,
    MashroomSecurityProvider,
    MashroomSecurityUser,
} from '@mashroom/mashroom-security/type-definitions';
import type {
    ExpressResponse,
    MashroomLogger,
} from '@mashroom/mashroom/type-definitions';
import type {ExpressRequestWithSession, OpenIDConnectAuthData} from "../../type-definitions";

export default class MashroomOpenIDConnectSecurityProvider implements MashroomSecurityProvider {

    constructor(private scope: string, private usePKCE: boolean = false, private extraAuthParams: any = {}) {
    }

    async canAuthenticateWithoutUserInteraction(): Promise<boolean> {
        return false;
    }

    async authenticate(request: ExpressRequestWithSession, response: ExpressResponse, authenticationHints: any = {}): Promise<MashroomSecurityAuthenticationResult> {
        const logger: MashroomLogger = request.pluginContext.loggerFactory('mashroom.security.provider.openid.connect');
        const { originalUrl } = request;

        logger.debug('Starting new OpenID Connect authentication flow');

        const client = await openIDConnectClient(request);
        if (!client) {
            return {
                status: 'error',
            };
        }

        const newAuthData: OpenIDConnectAuthData = {
            state: generators.random(),
            backUrl: originalUrl,
        };
        if (client.metadata.response_types && client.metadata.response_types.includes('id_token')) {
            newAuthData.nonce = generators.random();
        }

        let code_challenge = undefined;
        let code_challenge_method = undefined;
        if (this.usePKCE) {
            const code_verifier = generators.codeVerifier();
            newAuthData.codeVerifier = code_verifier;
            if (Array.isArray(client.metadata.code_challenge_methods_supported) && client.metadata.code_challenge_methods_supported.includes('S256')) {
                logger.debug('Using PKCE code challenge method: S256');
                code_challenge = generators.codeChallenge(code_verifier);
                code_challenge_method = 'S256'
            } else {
                logger.debug('Using PKCE code challenge method: plain');
                code_challenge = code_verifier;
            }
        }

        request.session[OICD_AUTH_DATA_SESSION_KEY] = newAuthData;

        const authorizationParameters: AuthorizationParameters = {
            scope: this.scope,
            state: newAuthData.state,
            nonce: newAuthData.nonce,
            code_challenge,
            code_challenge_method,
            ...this.extraAuthParams,
            ...authenticationHints,
        };

        const authorizationUrl = client.authorizationUrl(authorizationParameters);
        logger.debug('Redirecting to:', authorizationUrl);

        response.redirect(authorizationUrl);

        return {
            status: 'deferred',
        };
    }

    async checkAuthentication(request: ExpressRequestWithSession): Promise<void> {
        const logger: MashroomLogger = request.pluginContext.loggerFactory('mashroom.security.provider.openid.connect');

        const client = await openIDConnectClient(request);

        const user = this.getUser(request);
        const authData: OpenIDConnectAuthData | undefined = request.session[OICD_AUTH_DATA_SESSION_KEY];
        if (!client || !authData || !authData.tokenSet || !authData.lastTokenCheck) {
            return;
        }

        if (Date.now() - authData.lastTokenCheck < TOKEN_CHECK_INTERVAL_MS) {
            // Don't check the token too frequently
            return;
        }

        const refreshToken = authData.tokenSet.refresh_token;
        if (!refreshToken) {
            logger.warn(`No refresh token given. Authentication will expire at ${new Date((authData.tokenSet.expires_at || 0) * 1000)} and cannot be extended`);
            return;
        }

        try {
            const newTokenSet = await client.refresh(refreshToken);
            authData.lastTokenCheck = Date.now();
            authData.tokenSet = newTokenSet;
            if (!authData.tokenSet.refresh_token) {
                // Keep refresh token
                authData.tokenSet.refresh_token = refreshToken;
            }
            request.session[OICD_AUTH_DATA_SESSION_KEY] = authData;

            logger.debug(`Token refreshed for user ${user?.username}. Valid until: ${new Date((newTokenSet.expires_at || 0) * 1000)}. Claims:`);

        } catch (e) {
            logger.error(`Refreshing access token failed. Signing out user: ${user?.username}`, e);
            delete request.session[OICD_AUTH_DATA_SESSION_KEY];
        }
    }

    getAuthenticationExpiration(request: ExpressRequestWithSession): number | null | undefined {
        const authData: OpenIDConnectAuthData | undefined = request.session[OICD_AUTH_DATA_SESSION_KEY];
        if (authData && authData.tokenSet && authData.tokenSet.expires_at) {
            return authData.tokenSet.expires_at * 1000;
        }

        return undefined;
    }

    async revokeAuthentication(request: ExpressRequestWithSession): Promise<void> {
        const logger: MashroomLogger = request.pluginContext.loggerFactory('mashroom.security.provider.openid.connect');

        const client = await openIDConnectClient(request);
        const authData: OpenIDConnectAuthData | undefined = request.session[OICD_AUTH_DATA_SESSION_KEY];
        if (!client || !authData || !authData.tokenSet) {
            return;
        }

        try {
            logger.debug('Revoking token');
            const endSessionUrl = client.endSessionUrl({
                id_token_hint: authData.tokenSet.id_token,
            });

            const options = {
                uri: endSessionUrl,
                method: 'GET',
            };
            await requestNative(options);
        } catch (e) {
            logger.error('Error revoking token!', e);
        }
    }

    async login(): Promise<MashroomSecurityLoginResult> {
        return {
            success: false
        };
    }

    getUser(request: ExpressRequestWithSession): MashroomSecurityUser | null {
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

        return user;
    }

}
