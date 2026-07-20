
import type {ServerMetadata} from 'openid-client';
import type {MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';

// Session data
declare module 'express-session' {
    interface SessionData {
        __MASHROOM_SECURITY_OICD_USER?: MashroomSecurityUser;
        __MASHROOM_SECURITY_OICD_AUTH_DATA?: OpenIDConnectAuthData;
        [key: string]: any;
    }
}

export type Mode = 'OIDC' | 'OAuth2';

export type ClientConfiguration = {
    readonly mode: Mode;
    readonly issuerDiscoveryUrl: string | undefined | null;
    readonly issuerMetadata: ServerMetadata | undefined | null;
    readonly clientId: string;
    readonly clientSecret: string;
    readonly usePKCE: boolean;
    readonly redirectUrl: string;
    readonly httpRequestTimeoutMs: number;
}

export type CallbackConfiguration = {
    readonly rolesClaimName: string | undefined | null;
    readonly adminRoles: Array<string>;
    readonly extraDataMapping: Record<string, string> | undefined | null;
}

export type OpenIDConnectAuthRequestData = {
    readonly state: string;
    codeVerifier?: string;
    readonly backUrl: string;
}

export type TokenSet = {
    readonly access_token: string;
    readonly id_token: string | undefined;
    refresh_token: string | undefined;
    readonly expires_at: number;
};

export type OpenIDConnectAuthData = {
    lastTokenCheck: number;
    tokenSet: TokenSet;
}

