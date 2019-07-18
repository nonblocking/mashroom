// @flow

import CSRF from 'csrf';

import type {
    ExpressRequest,
    MashroomLogger,
    MashroomLoggerFactory
} from '@mashroom/mashroom/type-definitions';
import type {MashroomCSRFService as MashroomCSRFServiceeType} from '../../type-definitions';

const CSRF_TOKEN_SESSION_KEY = '__MASHROOM_CSRF_TOKEN';

export default class MashroomCSRFService implements MashroomCSRFServiceeType {

    _saltLength: number;
    _secretLength: number;
    _logger: MashroomLogger;

    constructor(saltLength: number, secretLength: number, loggerFactory: MashroomLoggerFactory) {
        this._saltLength = saltLength;
        this._secretLength = secretLength;
        this._logger = loggerFactory('mashroom.csrf.service');
    }

    getCSRFToken(request: ExpressRequest) {
        let sessionToken = request.session[CSRF_TOKEN_SESSION_KEY];
        if (!sessionToken) {
            sessionToken = this._createToken();
            request.session[CSRF_TOKEN_SESSION_KEY] = sessionToken;
        }

        return sessionToken;
    }

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
