
import fs from 'fs';
import path from 'path';
import querystring from 'querystring';
import {createHash} from 'crypto';

import type {
    MashroomSecurityProvider,
    MashroomSecurityService,
    MashroomSecurityUser
} from '@mashroom/mashroom-security/type-definitions';
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

        const user = this.getUserStore(request, logger).find((u: UserStoreEntry) => u.username === username);
        const passwordCorrect = user && user.passwordHash === passwordHash;

        if (user && passwordCorrect) {
            const { displayName, email, pictureUrl, extraData, roles, secrets } = user;
            const mashroomUser: MashroomSecurityUser = {
                username,
                displayName: displayName || username,
                email,
                pictureUrl,
                extraData,
                roles,
                secrets,
            };

            logger.debug('User successfully authenticated:', mashroomUser);

            request.session[SIMPLE_AUTH_USER_SESSION_KEY] = mashroomUser;
            request.session[SIMPLE_AUTH_EXPIRES_SESSION_KEY] = Date.now() + this.authenticationTimeoutSec * 1000;

            return {
                success: true
            };
        } else {
            logger.warn('User Authentication failed:', username);
            return {
                success: false,
                failureReason: user ? 'Invalid credentials' : 'User not found',
            };
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

    private getUserStore(request: ExpressRequest, logger: MashroomLogger): UserStore {
        if (this.userStore) {
            return this.userStore;
        }

        let userStore: UserStore;
        if (fs.existsSync(this.userStorePath)) {
            userStore = require(this.userStorePath);
            this.createRoleDefinitions(userStore, request, logger);
        } else {
            logger.warn(`No user definition found: ${this.userStorePath}.`);
            userStore = [];
        }

        this.userStore = userStore;
        return userStore;
    }

    private async createRoleDefinitions(userStore: UserStore, request: ExpressRequest, logger: MashroomLogger): Promise<void> {
        const securityService: MashroomSecurityService = request.pluginContext.services.security.service;

        const roles: Array<string> = [];
        userStore.forEach((user) => {
            user.roles?.forEach((role) => {
                if (roles.indexOf(role) === -1) {
                    roles.push(role);
                }
            });
        });

        logger.debug('Adding role definitions:', roles);

        roles.forEach((id) => {
            securityService.addRoleDefinition(request, {
                id,
            });
        });
    }
}
