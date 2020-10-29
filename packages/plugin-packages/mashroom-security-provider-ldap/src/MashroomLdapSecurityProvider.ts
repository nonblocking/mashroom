
import fs from 'fs';
import path from 'path';
import querystring from 'querystring';

import type {
    ExpressRequest,
    ExpressResponse,
    MashroomLogger,
    MashroomLoggerFactory,
} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomSecurityProvider,
    MashroomSecurityUser,
    MashroomSecurityAuthenticationResult,
    MashroomSecurityLoginResult
} from '@mashroom/mashroom-security/type-definitions';
import type {GroupToRoleMapping, LdapClient, LdapEntry} from '../type-definitions';

const LDAP_AUTH_USER_SESSION_KEY = '__MASHROOM_SECURITY_LDAP_AUTH_USER';
const LDAP_AUTH_EXPIRES_SESSION_KEY = '__MASHROOM_SECURITY_LDAP_AUTH_EXPIRES';

export default class MashroomLdapSecurityProvider implements MashroomSecurityProvider {

    private logger: MashroomLogger;
    private groupToRoleMappingPath: string | undefined | null;
    private groupToRoleMapping: GroupToRoleMapping | null;

    constructor(private loginPage: string, private userSearchFilter: string, private groupSearchFilter: string,
                private extraDataMapping: Record<string, string> | undefined | null,  private secretsMapping: Record<string, string> | undefined | null,
                groupToRoleMappingPath: string | undefined, private ldapClient: LdapClient, private serverRootFolder: string,
                private authenticationTimeoutSec: number, loggerFactory: MashroomLoggerFactory) {
        this.logger = loggerFactory('mashroom.security.provider.ldap');
        this.groupToRoleMappingPath = groupToRoleMappingPath;
        if (groupToRoleMappingPath) {
            const logger = loggerFactory('mashroom.security.provider.ldap');
            if (!path.isAbsolute(groupToRoleMappingPath)) {
                this.groupToRoleMappingPath = path.resolve(serverRootFolder, groupToRoleMappingPath);
            }
            if (this.groupToRoleMappingPath && fs.existsSync(this.groupToRoleMappingPath)) {
                logger.info(`Using user to role mapping: ${this.groupToRoleMappingPath}`);
            } else {
                logger.warn(`Group to role mapping file not found: ${groupToRoleMappingPath}`);
                this.groupToRoleMappingPath = null;
            }
        }
        this.groupToRoleMapping = null;
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
            request.session[LDAP_AUTH_EXPIRES_SESSION_KEY] = Date.now() + this.authenticationTimeoutSec * 1000;
        }
    }

    getAuthenticationExpiration(request: ExpressRequest): number | null | undefined {
        return request.session[LDAP_AUTH_EXPIRES_SESSION_KEY];
    }

    async revokeAuthentication(request: ExpressRequest): Promise<void> {
        delete request.session[LDAP_AUTH_EXPIRES_SESSION_KEY];
        delete request.session[LDAP_AUTH_USER_SESSION_KEY];
    }

    async login(request: ExpressRequest, username: string, password: string): Promise<MashroomSecurityLoginResult> {
        const logger: MashroomLogger = request.pluginContext.loggerFactory('mashroom.security.provider.ldap');

        let user: LdapEntry | null = null;
        const userSearchFilter = this.userSearchFilter.replace('@username@', username);
        logger.debug(`Search for users: ${userSearchFilter}`);
        const extraAttributes = [
            ...(this.secretsMapping ? Object.values(this.secretsMapping) : []),
            ...(this.extraDataMapping ? Object.values(this.extraDataMapping) : []),
        ];
        const users = await this.ldapClient.search(userSearchFilter, extraAttributes);
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
            try {
                await this.ldapClient.login(user, password);
            } catch (e) {
                return {
                    success: false
                };
            }

            let displayName = user.displayName;
            if (!displayName && user.sn) {
                displayName = `${user.givenName ? `${user.givenName} ` : ''}${user.sn}`;
            }
            if (!displayName) {
                displayName = user.cn;
            }

            let extraData: Record<string, any> | null = null;
            if (this.extraDataMapping) {
                extraData = {};
                Object.keys(this.extraDataMapping).forEach((extraDataProp) => {
                    if (extraData && user && this.extraDataMapping) {
                        extraData[extraDataProp] = user[this.extraDataMapping[extraDataProp]];
                    }
                });
            }

            let secrets: Record<string, any> | null = null;
            if (this.secretsMapping) {
                secrets = {};
                Object.keys(this.secretsMapping).forEach((secretsProp) => {
                    if (secrets && user && this.secretsMapping) {
                        secrets[secretsProp] = user[this.secretsMapping[secretsProp]];
                    }
                });
            }
            const groups = await this.getUserGroups(user, logger);
            const roles = this.getRolesForUserGroups(groups, logger);

            const mashroomUser: MashroomSecurityUser = {
                username,
                displayName,
                email: user.mail,
                // TODO: we could download the jpegPhoto (https://tools.ietf.org/html/rfc2798#section-2.6) and provide it somehow
                pictureUrl: null,
                extraData,
                secrets,
                roles,
            };

            logger.debug('User successfully authenticated:', mashroomUser);

            request.session[LDAP_AUTH_USER_SESSION_KEY] = mashroomUser;
            request.session[LDAP_AUTH_EXPIRES_SESSION_KEY] = Date.now() + this.authenticationTimeoutSec * 1000;

            return {
                success: true
            };
        }

        return {
            success: false
        };
    }

    getUser(request: ExpressRequest): MashroomSecurityUser | null | undefined {
        const timeout: number | undefined = request.session[LDAP_AUTH_EXPIRES_SESSION_KEY];
        if (!timeout) {
            return null;
        }
        if (timeout < Date.now()) {
            delete request.session[LDAP_AUTH_USER_SESSION_KEY];
            return null;
        }
        return request.session[LDAP_AUTH_USER_SESSION_KEY];
    }

    private async getUserGroups(user: LdapEntry, logger: MashroomLogger): Promise<Array<string>> {
        if (!this.groupSearchFilter || !this.groupSearchFilter.trim()) {
            return [];
        }

        const groupSearchFilter = `(&${this.groupSearchFilter}(member=${user.dn}))`;
        logger.debug(`Search for user groups: ${groupSearchFilter}`);
        const groupEntries = await this.ldapClient.search(groupSearchFilter);
        return groupEntries.map((e) => e.cn);
    }

    private getRolesForUserGroups(groups: Array<string>, logger: MashroomLogger): Array<string> {
        if (!groups || groups.length === 0) {
            return [];
        }

        const roles: Array<string> = [];
        const groupToRoles = this.getGroupToRoleMapping(logger);
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

    private getGroupToRoleMapping(logger: MashroomLogger): GroupToRoleMapping | null {
        if (!this.groupToRoleMappingPath) {
            return null;
        }
        if (this.groupToRoleMapping) {
            return this.groupToRoleMapping;
        }

        if (fs.existsSync(this.groupToRoleMappingPath)) {
            this.groupToRoleMapping = require(this.groupToRoleMappingPath);
        } else {
            logger.warn(`No group to roles definition found: ${this.groupToRoleMappingPath || '-'}.`);
            this.groupToRoleMapping = null;
        }

        return this.groupToRoleMapping;
    }
}
