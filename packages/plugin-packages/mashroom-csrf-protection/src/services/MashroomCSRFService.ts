// @ts-ignore

import CSRF from 'csrf';

import {ExpressRequest} from '@mashroom/mashroom/type-definitions';
import {MashroomCSRFService as MashroomCSRFServiceType} from '../../type-definitions';

const CSRF_TOKEN_SESSION_KEY = '__MASHROOM_CSRF_TOKEN';

export default class MashroomCSRFService implements MashroomCSRFServiceType {

    _saltLength: number;
    _secretLength: number;

    constructor(saltLength: number, secretLength: number) {
        this._saltLength = saltLength;
        this._secretLength = secretLength;
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    getCSRFToken(request: ExpressRequest) {
        let sessionToken = request.session[CSRF_TOKEN_SESSION_KEY];
        if (!sessionToken) {
            sessionToken = this._createToken();
            request.session[CSRF_TOKEN_SESSION_KEY] = sessionToken;
        }

        return sessionToken;
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    isValidCSRFToken(request: ExpressRequest, token: string) {
        const sessionToken = request.session[CSRF_TOKEN_SESSION_KEY];
        if (!sessionToken) {
            return false;
        }
        return sessionToken === token;
    }

    _createToken(): string {
        const csrf = new CSRF({
            saltLength: this._saltLength,
            secretLength: this._secretLength
        });
        const secret = csrf.secretSync();
        return csrf.create(secret);
    }
}
