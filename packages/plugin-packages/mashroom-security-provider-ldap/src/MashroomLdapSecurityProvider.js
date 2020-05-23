// @flow
/* eslint require-atomic-updates: warn */

import fs from 'fs';
import path from 'path';
import querystring from 'querystring';

import type {MashroomSecurityProvider, MashroomSecurityUser,} from '@mashroom/mashroom-security/type-definitions';
import type {
    ExpressRequest,
    ExpressResponse,
    MashroomLogger,
    MashroomLoggerFactory,
} from '@mashroom/mashroom/type-definitions';
import type {GroupToRoleMapping, LdapClient, LdapEntry} from '../type-definitions';

const LDAP_AUTH_USER_SESSION_KEY = '__MASHROOM_SECURITY_LDAP_AUTH_USER';
const LDAP_AUTH_EXPIRES_SESSION_KEY = '__MASHROOM_SECURITY_LDAP_AUTH_EXPIRES';

export default class MashroomLdapSecurityProvider implements MashroomSecurityProvider {

    _loginPage: string;
    _userSearchFilter: string;
    _groupSearchFilter: string;
    _groupToRoleMappingPath: ?string;
    _groupToRoleMapping: ?GroupToRoleMapping;
    _ldapClient: LdapClient;
    _authenticationTimeoutSec: number;

    constructor(loginPage: string, userSearchFilter: string, groupSearchFilter: string, groupToRoleMappingPath: ?string, ldapClient: LdapClient, serverRootFolder: string, authenticationTimeoutSec: number, loggerFactory: MashroomLoggerFactory) {
        this._loginPage = loginPage;
        this._userSearchFilter = userSearchFilter;
        this._groupSearchFilter = groupSearchFilter;
        this._groupToRoleMappingPath = groupToRoleMappingPath;
        this._ldapClient = ldapClient;
        this._authenticationTimeoutSec = authenticationTimeoutSec;

        if (groupToRoleMappingPath) {
            const logger = loggerFactory('mashroom.security.provider.ldap');
            if (!path.isAbsolute(groupToRoleMappingPath)) {
                this._groupToRoleMappingPath = path.resolve(serverRootFolder, groupToRoleMappingPath);
            }
            if (this._groupToRoleMappingPath && fs.existsSync(this._groupToRoleMappingPath)) {
                logger.info(`Using user to role mapping: ${this._groupToRoleMappingPath}`);
            } else {
                logger.warn(`Group to role mapping file not found: ${groupToRoleMappingPath}`);
                this._groupToRoleMappingPath = null;
            }
        }
        this._groupToRoleMapping = null;
    }

    async canAuthenticateWithoutUserInteraction() {
        return false;
    }

    async authenticate(request: ExpressRequest, response: ExpressResponse, authenticationHints: any = {}) {
        const encodedRedirectUrl = encodeURIComponent(request.originalUrl);
        const authenticationHintsQuery = querystring.stringify(authenticationHints);
        response.redirect(`${this._loginPage}?redirectUrl=${encodedRedirectUrl}${authenticationHintsQuery ? `&${authenticationHintsQuery}` : ''}`);
        return {
            status: 'deferred'
        };
    }

    async checkAuthentication(request: ExpressRequest) {
        if (this.getUser(request)) {
            request.session[LDAP_AUTH_EXPIRES_SESSION_KEY] = Date.now() + this._authenticationTimeoutSec * 1000;
        }
    }

    getAuthenticationExpiration(request: ExpressRequest) {
        return request.session[LDAP_AUTH_EXPIRES_SESSION_KEY];
    }

    async revokeAuthentication(request: ExpressRequest) {
        delete request.session[LDAP_AUTH_EXPIRES_SESSION_KEY];
        delete request.session[LDAP_AUTH_USER_SESSION_KEY];
    }

    async login(request: ExpressRequest, username: string, password: string) {
        const logger: MashroomLogger = request.pluginContext.loggerFactory('mashroom.security.provider.ldap');

        let user: ?LdapEntry = null;
        const userSearchFilter = this._userSearchFilter.replace('@username@', username);
        logger.debug(`Search for users: ${userSearchFilter}`);
        const users = await this._ldapClient.search(userSearchFilter);
        if (users.length > 0) {
            if (users.length === 1) {
                user = users[0]
            } else {
                logger.warn(`Multiple users found for search query: ${userSearchFilter}`);
                return {
                    success: false
                };
            }
        } else {
            logger.warn(`No users found for search query: ${userSearchFilter}`);
            return {
                success: false
            };
        }

        if (user) {
            await this._ldapClient.login(user, password);

            const groups = await this._getUserGroups(user, logger);
            const roles = this._getRolesForUserGroups(groups, logger);

            const mashroomUser: MashroomSecurityUser = {
                username,
                displayName: user.cn,
                email: user.mail,
                pictureUrl: null,
                roles,
                extraData: null,
            };

            logger.debug('User successfully authenticated:', mashroomUser);

            request.session[LDAP_AUTH_USER_SESSION_KEY] = mashroomUser;
            request.session[LDAP_AUTH_EXPIRES_SESSION_KEY] = Date.now() + this._authenticationTimeoutSec * 1000;

            return {
                success: true
            };
        }

        return {
            success: false
        };
    }

    getUser(request: ExpressRequest) {
        const timeout: ?number = request.session[LDAP_AUTH_EXPIRES_SESSION_KEY];
        if (!timeout) {
            return null;
        }
        if (timeout < Date.now()) {
            delete request.session[LDAP_AUTH_USER_SESSION_KEY];
            return null;
        }
        return request.session[LDAP_AUTH_USER_SESSION_KEY];
    }

    getApiSecurityHeaders() {
        return null;
    }

    async _getUserGroups(user: LdapEntry, logger: MashroomLogger): Promise<Array<string>> {
        if (!this._groupSearchFilter || !this._groupSearchFilter.trim()) {
            return [];
        }

        const groupSearchFilter = `(&${this._groupSearchFilter}(member=${user.dn}))`;
        logger.debug(`Search for user groups: ${groupSearchFilter}`);
        const groupEntries = await this._ldapClient.search(groupSearchFilter);
        return groupEntries.map((e) => e.cn);
    }

    _getRolesForUserGroups(groups: Array<string>, logger: MashroomLogger): Array<string> {
        if (!groups || groups.length === 0) {
            return [];
        }

        const roles = [];
        const groupToRoles = this._getGroupToRoleMapping(logger);
        if (groupToRoles) {
            groups.forEach((group) => {
                if (groupToRoles.hasOwnProperty(group)) {
                    const groupRoles = groupToRoles[group];
                    if (groupRoles && Array.isArray(groupRoles)) {
                        groupToRoles[group].forEach((role) => roles.push(role));
                    }
                }
            });
        } else {
            // If no mapping defined treat groups as roles
            groups.forEach((g) => roles.push(g));
        }
        return roles;
    }

    _getGroupToRoleMapping(logger: MashroomLogger): ?GroupToRoleMapping {
        if (!this._groupToRoleMappingPath) {
            return null;
        }
        if (this._groupToRoleMapping) {
            return this._groupToRoleMapping;
        }

        if (fs.existsSync(this._groupToRoleMappingPath)) {
            this._groupToRoleMapping = require(this._groupToRoleMappingPath);
        } else {
            logger.warn(`No group to roles definition found: ${this._groupToRoleMappingPath || '-'}.`);
            this._groupToRoleMapping = null;
        }

        return this._groupToRoleMapping;
    }
}
