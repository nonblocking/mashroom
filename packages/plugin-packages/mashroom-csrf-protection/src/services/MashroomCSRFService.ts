
import CSRF from 'csrf';

import type {Request} from 'express';
import type {MashroomCSRFService as MashroomCSRFServiceType} from '../../type-definitions';

const CSRF_TOKEN_SESSION_KEY = '__MASHROOM_CSRF_TOKEN';

export default class MashroomCSRFService implements MashroomCSRFServiceType {

    constructor(private _saltLength: number, private _secretLength: number) {
    }

    getCSRFToken(request: Request): string {
        let sessionToken = request.session[CSRF_TOKEN_SESSION_KEY];
        if (!sessionToken) {
            sessionToken = this._createToken();
            request.session[CSRF_TOKEN_SESSION_KEY] = sessionToken;
        }

        return sessionToken;
    }

    isValidCSRFToken(request: Request, token: string): boolean {
        const sessionToken = request.session[CSRF_TOKEN_SESSION_KEY];
        if (!sessionToken) {
            return false;
        }
        return sessionToken === token;
    }

    private _createToken(): string {
        const csrf = new CSRF({
            saltLength: this._saltLength,
            secretLength: this._secretLength
        });
        const secret = csrf.secretSync();
        return csrf.create(secret);
    }
}
