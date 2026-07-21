import {FALLBACK_TOKEN_EXPIRE_IN_SEC} from './constants';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {TokenEndpointResponse} from 'openid-client';
import type {TokenSet} from '../type-definitions';

export default (response: TokenEndpointResponse, logger: MashroomLogger): TokenSet => {
    if (!response.expires_in) {
        // This only happens if this is actually a fixed App token like the ones issued by GitHub
        logger.warn(`Received token set without expiration. Setting an expiration in ${FALLBACK_TOKEN_EXPIRE_IN_SEC} sec.`);
    }

    return {
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        id_token: response.id_token,
        expires_at: Date.now() / 1000 + (response.expires_in ?? FALLBACK_TOKEN_EXPIRE_IN_SEC), // sec
    };
};
