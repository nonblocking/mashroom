
import fs from 'fs';
import path from 'path';
import querystring from 'querystring';
import {createHash} from 'crypto';

import type {MashroomSecurityProvider, MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';
import type {
    ExpressRequest,
    ExpressResponse,
    MashroomLogger,
    MashroomLoggerFactory
} from '@mashroom/mashroom/type-definitions';
import type {UserStore, UserStoreEntry} from '../type-definitions';
import {
    MashroomSecurityAuthenticationResult,
    MashroomSecurityLoginResult
} from '@mashroom/mashroom-security/type-definitions';

const SIMPLE_AUTH_USER_SESSION_KEY = '__MASHROOM_SECURITY_SIMPLE_AUTH_USER';
const SIMPLE_AUTH_EXPIRES_SESSION_KEY = '__MASHROOM_SECURITY_SIMPLE_AUTH_EXPIRES';

export default class MashroomSimpleSecurityProvider implements MashroomSecurityProvider {

    private userStorePath: string;
    private userStore: UserStore | null;

    constructor(userStorePath: string, private loginPage: string, private serverRootFolder: string, private authenticationTimeoutSec: number, loggerFactory: MashroomLoggerFactory) {
        const logger = loggerFactory('mashroom.security.provider.simple');

        this.userStore = null;
        this.userStorePath = userStorePath;
        if (!path.isAbsolute(this.userStorePath)) {
            this.userStorePath = path.resolve(serverRootFolder, this.userStorePath);
        }
        logger.info(`Using user store: ${this.userStorePath}`);
        logger.info(`Configured login page: ${this.loginPage}`);
    }

    async canAuthenticateWithoutUserInteraction(): Promise<boolean> {
        return false;
    }

    async authenticate(request: ExpressRequest, response: ExpressResponse, authenticationHints: any = {}): Promise<MashroomSecurityAuthenticationResult> {
        const encodedRedirectUrl = encodeURIComponent(request.originalUrl);
        const authenticationHintsQuery = querystring.stringify(authenticationHints);
        response.redirect(`${this.loginPage}?redirectUrl=${encodedRedirectUrl}${authenticationHintsQuery ? `&${authenticationHintsQuery}` : ''}`);
        return {
            status: 'deferred'
        };
    }

    async checkAuthentication(request: ExpressRequest): Promise<void> {
        if (this.getUser(request)) {
            request.session[SIMPLE_AUTH_EXPIRES_SESSION_KEY] = Date.now() + this.authenticationTimeoutSec * 1000;
        }
    }

    getAuthenticationExpiration(request: ExpressRequest): number | null | undefined {
        return request.session[SIMPLE_AUTH_EXPIRES_SESSION_KEY];
    }

    async revokeAuthentication(request: ExpressRequest): Promise<void> {
        delete request.session[SIMPLE_AUTH_EXPIRES_SESSION_KEY];
        delete request.session[SIMPLE_AUTH_USER_SESSION_KEY];
    }

    async login(request: ExpressRequest, username: string, password: string): Promise<MashroomSecurityLoginResult> {
        const logger: MashroomLogger = request.pluginContext.loggerFactory('mashroom.security.provider.simple');

        const passwordHash = createHash('sha256').update(password).digest('hex');

        const user = this._getUserStore(logger).find((u: UserStoreEntry) => u.username === username && u.passwordHash === passwordHash);

        if (user) {
            const mashroomUser: MashroomSecurityUser = {
                username,
                displayName: user.displayName || username,
                email: user.email,
                pictureUrl: user.pictureUrl,
                roles: user.roles,
                extraData: null,
            };

            logger.debug('User successfully authenticated:', mashroomUser);

            request.session[SIMPLE_AUTH_USER_SESSION_KEY] = mashroomUser;
            request.session[SIMPLE_AUTH_EXPIRES_SESSION_KEY] = Date.now() + this.authenticationTimeoutSec * 1000;

            return {
                success: true
            }
        } else {
            logger.warn('User Authentication failed:', username);
            return {
                success: false
            }
        }
    }

    getUser(request: ExpressRequest): MashroomSecurityUser | null | undefined {
        const timeout: number = request.session[SIMPLE_AUTH_EXPIRES_SESSION_KEY];
        if (!timeout) {
            return null;
        }
        if (timeout < Date.now()) {
            delete request.session[SIMPLE_AUTH_USER_SESSION_KEY];
            return null;
        }
        return request.session[SIMPLE_AUTH_USER_SESSION_KEY];
    }

    _getUserStore(logger: MashroomLogger): UserStore {
        if (this.userStore) {
            return this.userStore;
        }

        let userStore: UserStore;
        if (fs.existsSync(this.userStorePath)) {
            userStore = require(this.userStorePath);
        } else {
            logger.warn(`No user definition found: ${this.userStorePath}.`);
            userStore = [];
        }

        this.userStore = userStore;
        return userStore;
    }
}
