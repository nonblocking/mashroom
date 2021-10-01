
import fs from 'fs';
import path from 'path';
import querystring from 'querystring';
import {createHash} from 'crypto';

import type {Request, Response} from 'express';
import type {
    MashroomSecurityProvider,
    MashroomSecurityService,
    MashroomSecurityUser
} from '@mashroom/mashroom-security/type-definitions';
import type {
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

    private _userStorePath: string;
    private _userStore: UserStore | null;

    constructor(userStorePath: string, private _loginPage: string, private _serverRootFolder: string, private _authenticationTimeoutSec: number, loggerFactory: MashroomLoggerFactory) {
        const logger = loggerFactory('mashroom.security.provider.simple');

        this._userStore = null;
        this._userStorePath = userStorePath;
        if (!path.isAbsolute(this._userStorePath)) {
            this._userStorePath = path.resolve(_serverRootFolder, this._userStorePath);
        }
        logger.info(`Using user store: ${this._userStorePath}`);
        logger.info(`Configured login page: ${this._loginPage}`);
    }

    async canAuthenticateWithoutUserInteraction(): Promise<boolean> {
        return false;
    }

    async authenticate(request: Request, response: Response, authenticationHints: any = {}): Promise<MashroomSecurityAuthenticationResult> {
        const encodedRedirectUrl = encodeURIComponent(request.originalUrl);
        const authenticationHintsQuery = querystring.stringify(authenticationHints);
        response.redirect(`${this._loginPage}?redirectUrl=${encodedRedirectUrl}${authenticationHintsQuery ? `&${authenticationHintsQuery}` : ''}`);
        return {
            status: 'deferred'
        };
    }

    async checkAuthentication(request: Request): Promise<void> {
        if (this.getUser(request)) {
            request.session[SIMPLE_AUTH_EXPIRES_SESSION_KEY] = Date.now() + this._authenticationTimeoutSec * 1000;
        }
    }

    getAuthenticationExpiration(request: Request): number | null | undefined {
        return request.session[SIMPLE_AUTH_EXPIRES_SESSION_KEY];
    }

    async revokeAuthentication(request: Request): Promise<void> {
        delete request.session[SIMPLE_AUTH_EXPIRES_SESSION_KEY];
        delete request.session[SIMPLE_AUTH_USER_SESSION_KEY];
    }

    async login(request: Request, username: string, password: string): Promise<MashroomSecurityLoginResult> {
        const logger: MashroomLogger = request.pluginContext.loggerFactory('mashroom.security.provider.simple');

        const passwordHash = createHash('sha256').update(password).digest('hex');

        const user = this._getUserStore(request, logger).find((u: UserStoreEntry) => u.username === username);
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
            request.session[SIMPLE_AUTH_EXPIRES_SESSION_KEY] = Date.now() + this._authenticationTimeoutSec * 1000;

            // Make sure the user is in the session when this method returns (file session store is async)
            await new Promise<void>((resolve) => request.session.save(() => resolve()));

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

    getUser(request: Request): MashroomSecurityUser | null | undefined {
        if (!request.session) {
            return null;
        }
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

    private _getUserStore(request: Request, logger: MashroomLogger): UserStore {
        if (this._userStore) {
            return this._userStore;
        }

        let userStore: UserStore;
        if (fs.existsSync(this._userStorePath)) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const userData = require(this._userStorePath);
            userStore = Array.isArray(userData) ? userData : (userData.users || []);
            this._createRoleDefinitions(userStore, request, logger);
        } else {
            logger.warn(`No user definition found: ${this._userStorePath}.`);
            userStore = [];
        }

        this._userStore = userStore;
        return userStore;
    }

    private async _createRoleDefinitions(userStore: UserStore, request: Request, logger: MashroomLogger): Promise<void> {
        const securityService: MashroomSecurityService = request.pluginContext.services.security.service;
        const existingRoles = (await securityService.getExistingRoles(request)).map((def) => def.id);

        const roles: Array<string> = [];
        userStore.forEach((user) => {
            if (Array.isArray(user.roles)) {
                user.roles.forEach((role) => {
                    if (existingRoles.indexOf(role) === -1 && roles.indexOf(role) === -1) {
                        roles.push(role);
                    }
                });
            }
        });

        logger.debug('Adding new role definitions:', roles);
        for (const id of roles) {
            await securityService.addRoleDefinition(request, {
                id,
            });
        }
    }
}
