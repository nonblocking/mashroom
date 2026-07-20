import type {TokenEndpointResponse} from 'openid-client';
import type {TokenSet} from '../type-definitions';

export default (response: TokenEndpointResponse): TokenSet => {
    return {
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        id_token: response.id_token,
        expires_at: Date.now() / 1000 + (response.expires_in ?? 0), // sec
    };
};
