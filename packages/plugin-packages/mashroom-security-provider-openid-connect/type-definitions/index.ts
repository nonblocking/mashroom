
import type {IssuerMetadata, ResponseType, TokenSet} from 'openid-client';

export type Mode = 'OIDC' | 'OAuth2';

export type ClientConfiguration = {
    issuerDiscoveryUrl: string | undefined | null;
    issuerMetadata: IssuerMetadata | undefined | null;
    clientId: string;
    clientSecret: string;
    redirectUrl: string;
    responseType: ResponseType;
    httpRequestTimeoutMs: number;
}

export type CallbackConfiguration = {
    mode: Mode;
    rolesClaimName: string | undefined | null;
    adminRoles: Array<string>;
    extraDataMapping: Record<string, string> | undefined | null;
}

export type OpenIDConnectAuthRequestData = {
    state: string;
    nonce?: string;
    codeVerifier?: string;
    backUrl: string;
}

export type OpenIDConnectAuthData = {
    lastTokenCheck: number;
    tokenSet: TokenSet;
}

