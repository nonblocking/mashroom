
import type {IssuerMetadata, ResponseType, TokenSet} from 'openid-client';

export type Mode = 'OIDC' | 'OAuth2';

export type ClientConfiguration = {
    issuerDiscoveryUrl: string | undefined | null;
    issuerMetadata: IssuerMetadata | undefined | null;
    clientId: string;
    clientSecret: string;
    redirectUrl: string;
    responseType: ResponseType;
    httpRequestRejectUnauthorized: boolean;
    httpRequestTimeoutMs: number;
    httpRequestRetry: number;
}

export type CallbackConfiguration = {
    mode: Mode;
    rolesClaimName: string | undefined | null;
    adminRoles: Array<string>;
}

export type OpenIDConnectAuthData = {
    state?: string | undefined;
    nonce?: string | undefined;
    codeVerifier?: string | undefined;
    backUrl?: string | undefined;
    lastTokenCheck?: number | undefined;
    tokenSet?: TokenSet | undefined;
}
