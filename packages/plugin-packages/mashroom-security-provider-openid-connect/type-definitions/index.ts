import {IdTokenClaims, ResponseType, TokenSet} from 'openid-client';
import {ExpressRequest} from '@mashroom/mashroom/type-definitions';

export type ExpressRequestWithSession = ExpressRequest & {
    session: any;
}

export type ClientConfiguration = {
    discoveryUrl: string;
    clientId: string;
    clientSecret: string;
    redirectUrl: string;
    responseType: ResponseType;
}

export type OpenIDConnectAuthData = {
    state?: string | undefined;
    nonce?: string | undefined;
    codeVerifier?: string | undefined;
    backUrl?: string | undefined;
    lastTokenCheck?: number | undefined;
    tokenSet?: TokenSet | undefined;
    claims?: IdTokenClaims | undefined;
}
