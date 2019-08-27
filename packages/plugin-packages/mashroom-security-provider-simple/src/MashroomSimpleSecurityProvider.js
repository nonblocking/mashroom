// @flow

import fs from 'fs';
import path from 'path';
import shajs from 'sha.js';

import type {
    MashroomSecurityProvider, MashroomSecurityUser
} from '@mashroom/mashroom-security/type-definitions';
import type {
    ExpressRequest,
    ExpressResponse,
    MashroomLogger,
    MashroomLoggerFactory
} from '@mashroom/mashroom/type-definitions';
import type {UserStore} from '../type-definitions';

const AUTHENTICATION_RESULT_SESSION_KEY = '__MASHROOM_SECURITY_AUTH_USER';
const AUTHENTICATION_EXPIRES_SESSION_KEY = '__MASHROOM_SECURITY_AUTH_EXPIRES';

export default class MashroomSimpleSecurityProvider implements MashroomSecurityProvider {

    _userStore: UserStore;
    _userStorePath: string;
    _loginPage: string;
    _authenticationTimeoutSec: number;
    _logger: MashroomLogger;

    constructor(userStorePath: string, loginPage: string, serverRootFolder: string, authenticationTimeoutSec: number, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.security.provider.simple');

        this._userStorePath = userStorePath;
        if (!path.isAbsolute(this._userStorePath)) {
            this._userStorePath = path.resolve(serverRootFolder, this._userStorePath);
        }
        this._logger.info(`Using user store: ${this._userStorePath}`);

        this._loginPage = loginPage;
        this._authenticationTimeoutSec = authenticationTimeoutSec;
        this._logger.info(`Configured login page: ${this._loginPage}`);
    }

    async authenticate(request: ExpressRequest, response: ExpressResponse) {
        let buff = Buffer.from(decodeURI(request.originalUrl));
        const base64encodedReferrer = buff.toString('base64');
        response.redirect(`${this._loginPage}?ref=${base64encodedReferrer}`);
        return {
            status: 'deferred'
        };
    }

    async checkAuthentication(request: ExpressRequest) {
        request.session[AUTHENTICATION_EXPIRES_SESSION_KEY] = Date.now() + this._authenticationTimeoutSec * 1000;
    }

    getAuthenticationExpiration(request: ExpressRequest) {
        return request.session[AUTHENTICATION_EXPIRES_SESSION_KEY];
    }

    async revokeAuthentication() {
        // Nothing to do, the session has been regenerated at this point
    }

    async login(request: ExpressRequest, username: string, password: string) {
        const passwordHash = shajs('sha256').update(password).digest('hex');

        const user = this._getUserStore().find((u) => u.username === username && u.passwordHash === passwordHash);

        if (user) {
            this._logger.debug('User successfully authenticated:', username);
            const mashroomUser: MashroomSecurityUser = {
                username,
                displayName: user.displayName,
                roles: user.roles
            };

            request.session[AUTHENTICATION_RESULT_SESSION_KEY] = mashroomUser;
            request.session[AUTHENTICATION_EXPIRES_SESSION_KEY] = Date.now() + this._authenticationTimeoutSec * 1000;

            return {
                success: true
            }
        } else {
            this._logger.warn('User Authentication failed', username);
            return {
                success: false
            }
        }
    }

    getUser(request: ExpressRequest) {
        const timeout: ?number = request.session[AUTHENTICATION_EXPIRES_SESSION_KEY];
        if (!timeout) {
            return null;
        }
        if (timeout < Date.now()) {
            delete request.session[AUTHENTICATION_RESULT_SESSION_KEY];
            return null;
        }
        return request.session[AUTHENTICATION_RESULT_SESSION_KEY];
    }

    _getUserStore(): UserStore {
        if (this._userStore) {
            return this._userStore;
        }

        if (fs.existsSync(this._userStorePath)) {
            this._userStore = require(this._userStorePath);
        } else {
            this._logger.warn(`No user definition found: ${this._userStorePath}.`);
            this._userStore = [];
        }

        return this._userStore;
    }
}
