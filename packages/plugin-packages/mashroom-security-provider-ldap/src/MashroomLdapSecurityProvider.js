// @flow

import fs from 'fs';
import path from 'path';

import type {
    MashroomSecurityProvider, MashroomSecurityUser,
} from '@mashroom/mashroom-security/type-definitions';
import type {
    MashroomLogger,
    MashroomLoggerFactory,
    ExpressRequest,
    ExpressResponse
} from '@mashroom/mashroom/type-definitions';
import type {GroupToRoleMapping, LdapClient, LdapEntry} from '../type-definitions';

const AUTHENTICATION_RESULT_SESSION_KEY = '__MASHROOM_SECURITY_AUTH';

export default class MashroomLdapSecurityProvider implements MashroomSecurityProvider {

    _loginPage: string;
    _userSearchFilter: string;
    _groupSearchFilter: string;
    _groupToRoleMappingPath: ?string;
    _groupToRoleMapping: ?GroupToRoleMapping;
    _ldapClient: LdapClient;
    _logger: MashroomLogger;

    constructor(loginPage: string, userSearchFilter: string, groupSearchFilter: string, groupToRoleMappingPath: ?string, ldapClient: LdapClient, serverRootFolder: string, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.security.provider.ldap');
        this._loginPage = loginPage;
        this._userSearchFilter = userSearchFilter;
        this._groupSearchFilter = groupSearchFilter;
        this._groupToRoleMappingPath = groupToRoleMappingPath;
        this._ldapClient = ldapClient;

        if (groupToRoleMappingPath) {
            if (!path.isAbsolute(groupToRoleMappingPath)) {
                this._groupToRoleMappingPath = path.resolve(serverRootFolder, groupToRoleMappingPath);
            }
            if (this._groupToRoleMappingPath && fs.existsSync(this._groupToRoleMappingPath)) {
                this._logger.info(`Using user to role mapping: ${this._groupToRoleMappingPath}`);
            } else {
                this._logger.warn(`Group to role mapping file not found: ${groupToRoleMappingPath}`);
                this._groupToRoleMappingPath = null;
            }
        }
        this._groupToRoleMapping = null;
    }

    async authenticate(request: ExpressRequest, response: ExpressResponse) {
        response.redirect(`${this._loginPage}?ref=${request.originalUrl}`);
        return {
            status: 'deferred'
        };
    }

    async login(request: ExpressRequest, username: string, password: string) {
        let user: ?LdapEntry = null;
        const userSearchFilter = this._userSearchFilter.replace('@username@', username);
        this._logger.debug(`Search for users: ${userSearchFilter}`);
        const users = await this._ldapClient.search(userSearchFilter);
        if (users.length > 0) {
            if (users.length === 1) {
                user = users[0]
            } else {
                this._logger.warn(`Multiple users found for search query: ${userSearchFilter}`);
                return {
                    success: false
                };
            }
        } else {
            this._logger.warn(`No users found for search query: ${userSearchFilter}`);
            return {
                success: false
            };
        }

        if (user) {
            await this._ldapClient.login(user, password);

            const groups = await this._getUserGroups(user);
            this._logger.debug(`Found user groups for user ${username}: `, groups);

            const roles = this.getRolesForUserGroups(groups);
            this._logger.debug(`Found roles for user ${username}: `, roles);

            const mashroomUser: MashroomSecurityUser = {
                username,
                displayName: user.cn,
                roles,
                groups
            };

            request.session[AUTHENTICATION_RESULT_SESSION_KEY] = mashroomUser;

            return {
                success: true
            };
        }

        return {
            success: false
        };
    }

    async revokeAuthentication(request: ExpressRequest) {
        // Nothing to do, the session has been regenerated at this point
    }

    getUser(request: ExpressRequest) {
        return request.session[AUTHENTICATION_RESULT_SESSION_KEY];
    }

    async _getUserGroups(user: LdapEntry): Promise<Array<string>> {
        if (!this._groupSearchFilter || !this._groupSearchFilter.trim()) {
            return [];
        }

        const groupSearchFilter = `(&${this._groupSearchFilter}(member=${user.dn}))`;
        this._logger.debug(`Search for user groups: ${groupSearchFilter}`);
        const groupEntries = await this._ldapClient.search(groupSearchFilter);
        return groupEntries.map((e) => e.cn);
    }

    getRolesForUserGroups(groups: Array<string>): Array<string> {
        if (!groups || groups.length === 0) {
            return [];
        }

        const roles = [];
        const groupToRoles = this._getGroupToRoleMapping();
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

    _getGroupToRoleMapping(): ?GroupToRoleMapping {
        if (!this._groupToRoleMappingPath) {
            return null;
        }
        if (this._groupToRoleMapping) {
            return this._groupToRoleMapping;
        }

        if (fs.existsSync(this._groupToRoleMappingPath)) {
            this._groupToRoleMapping = require(this._groupToRoleMappingPath);
        } else {
            this._logger.warn(`No group to roles definition found: ${this._groupToRoleMappingPath || '-'}.`);
            this._groupToRoleMapping = null;
        }

        return this._groupToRoleMapping;
    }
}
