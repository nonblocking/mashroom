
import fs from 'fs';
import path from 'path';
import querystring from 'querystring';
import loginFailureReason from './login-failure-reason';

import type {MashroomSecurityService,
    MashroomSecurityProvider,
    MashroomSecurityUser,
    MashroomSecurityAuthenticationResult,
    MashroomSecurityLoginResult
} from '@mashroom/mashroom-security/type-definitions';
import type {Request, Response} from 'express';
import type {
    MashroomLogger,
    MashroomLoggerFactory,
} from '@mashroom/mashroom/type-definitions';
import type {GroupToRoleMapping, UserToRoleMapping, LdapClient, LdapEntryUser, BaseLdapEntry} from '../type-definitions';

const LDAP_AUTH_USER_SESSION_KEY = '__MASHROOM_SECURITY_LDAP_AUTH_USER';
const LDAP_AUTH_EXPIRES_SESSION_KEY = '__MASHROOM_SECURITY_LDAP_AUTH_EXPIRES';
const LDAP_SPECIAL_CHARACTERS = [',', '=', '+', '<', '>', '#', ';'];

export default class MashroomLdapSecurityProvider implements MashroomSecurityProvider {

    private _groupToRoleMappingPath: string | undefined | null;
    private _groupToRoleMapping: GroupToRoleMapping | undefined | null;
    private _userToRoleMappingPath: string | undefined | null;
    private _userToRoleMapping: UserToRoleMapping | undefined |null;

    constructor(private _loginPage: string, private _userSearchFilter: string, private _groupSearchFilter: string,
                private _extraDataMapping: Record<string, string> | undefined | null,  private _secretsMapping: Record<string, string> | undefined | null,
                groupToRoleMappingPath: string | undefined| null, userToRoleMappingPath: string | undefined| null,
                private _ldapClient: LdapClient, _serverRootFolder: string,
                private _authenticationTimeoutSec: number, loggerFactory: MashroomLoggerFactory) {
        const logger = loggerFactory('mashroom.security.provider.ldap');
        if (groupToRoleMappingPath) {
            this._groupToRoleMappingPath = groupToRoleMappingPath;
            if (!path.isAbsolute(groupToRoleMappingPath)) {
                this._groupToRoleMappingPath = path.resolve(_serverRootFolder, groupToRoleMappingPath);
            }
            if (this._groupToRoleMappingPath && fs.existsSync(this._groupToRoleMappingPath)) {
                logger.info(`Using group to role mapping: ${this._groupToRoleMappingPath}`);
            } else {
                logger.warn(`Group to role mapping file not found: ${groupToRoleMappingPath}`);
                this._groupToRoleMappingPath = null;
            }
        }
        if (userToRoleMappingPath) {
            this._userToRoleMappingPath = userToRoleMappingPath;
            if (!path.isAbsolute(userToRoleMappingPath)) {
                this._userToRoleMappingPath = path.resolve(_serverRootFolder, userToRoleMappingPath);
            }
            if (this._userToRoleMappingPath && fs.existsSync(this._userToRoleMappingPath)) {
                logger.info(`Using user to role mapping: ${this._userToRoleMappingPath}`);
            } else {
                logger.warn(`Using to role mapping file not found: ${userToRoleMappingPath}`);
                this._userToRoleMappingPath = null;
            }
        }
    }

    async canAuthenticateWithoutUserInteraction(): Promise<boolean> {
        return false;
    }

    async authenticate(request: Request, response: Response, authenticationHints: any = {}): Promise<MashroomSecurityAuthenticationResult> {
        // Prevent a redirect loop if the login page is not accessible
        if (request.originalUrl.startsWith(`${this._loginPage}?redirectUrl=`)) {
            return {
                status: 'error'
            };
        }

        const encodedRedirectUrl = encodeURIComponent(encodeURIComponent(request.originalUrl));
        const authenticationHintsQuery = querystring.stringify(authenticationHints);
        response.redirect(`${this._loginPage}?redirectUrl=${encodedRedirectUrl}${authenticationHintsQuery ? `&${authenticationHintsQuery}` : ''}`);
        return {
            status: 'deferred'
        };
    }

    async checkAuthentication(request: Request): Promise<void> {
        if (this.getUser(request)) {
            request.session[LDAP_AUTH_EXPIRES_SESSION_KEY] = Date.now() + this._authenticationTimeoutSec * 1000;
        }
    }

    getAuthenticationExpiration(request: Request): number | null | undefined {
        return request.session[LDAP_AUTH_EXPIRES_SESSION_KEY];
    }

    async revokeAuthentication(request: Request): Promise<void> {
        delete request.session[LDAP_AUTH_EXPIRES_SESSION_KEY];
        delete request.session[LDAP_AUTH_USER_SESSION_KEY];
    }

    async login(request: Request, username: string, password: string): Promise<MashroomSecurityLoginResult> {
        const logger: MashroomLogger = request.pluginContext.loggerFactory('mashroom.security.provider.ldap');

        // Because LDAP accepts logins with empty passwords (simple login) we need to be extra careful here
        if (!password?.trim()) {
            return {
                success: false,
                failureReason: 'User not found'
            };
        }

        let user: LdapEntryUser | null = null;
        const userSearchFilter = this._userSearchFilter.replace('@username@', username);
        logger.debug(`Search for users: ${userSearchFilter}`);
        const extraAttributes = [
            ...(this._secretsMapping ? Object.values(this._secretsMapping) : []),
            ...(this._extraDataMapping ? Object.values(this._extraDataMapping) : []),
        ];
        const users = await this._ldapClient.searchUser(userSearchFilter, extraAttributes);
        if (users.length > 0) {
            if (users.length === 1) {
                user = users[0];
            } else {
                logger.warn(`Multiple users found for search query: ${userSearchFilter}`);
                return {
                    success: false,
                    failureReason: 'User not found'
                };
            }
        } else {
            logger.warn(`No users found for search query: ${userSearchFilter}`);
            return {
                success: false,
                failureReason: 'User not found'
            };
        }

        if (user) {
            try {
                await this._ldapClient.login(user, password);
            } catch (e: any) {
                return {
                    success: false,
                    failureReason: loginFailureReason(e.message),
                    failureReasonDetails: e.message,
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
            if (this._extraDataMapping) {
                extraData = {};
                Object.keys(this._extraDataMapping).forEach((extraDataProp) => {
                    if (extraData && user && this._extraDataMapping) {
                        extraData[extraDataProp] = user[this._extraDataMapping[extraDataProp]];
                    }
                });
            }

            let secrets: Record<string, any> | null = null;
            if (this._secretsMapping) {
                secrets = {};
                Object.keys(this._secretsMapping).forEach((secretsProp) => {
                    if (secrets && user && this._secretsMapping) {
                        secrets[secretsProp] = user[this._secretsMapping[secretsProp]];
                    }
                });
            }
            const groups = await this.getUserGroups(user, logger);
            const roles = this._getRoles(request, username, groups, logger);

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
            request.session[LDAP_AUTH_EXPIRES_SESSION_KEY] = Date.now() + this._authenticationTimeoutSec * 1000;
            if (request.session.cookie.maxAge && this._authenticationTimeoutSec * 1000 >= request.session.cookie.maxAge) {
                logger.error(`Configuration error detected: The authenticationTimeoutSec (${this._authenticationTimeoutSec}s) value is higher than the session cookie maxAge (${Math.trunc(request.session.cookie.maxAge / 1000)}s). Since the authentication is stored in the session this might lead to unexpected behaviour.`);
            }

            // Make sure the user is in the session when this method returns (file session store is async)
            await new Promise<void>((resolve) => request.session.save(() => resolve()));

            return {
                success: true
            };
        }

        return {
            success: false,
            failureReason: 'User not found'
        };
    }

    getUser(request: Request): MashroomSecurityUser | null | undefined {
        if (!request.session) {
            return null;
        }
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

    private async getUserGroups(user: BaseLdapEntry, logger: MashroomLogger): Promise<Array<string>> {
        if (!this._groupSearchFilter || !this._groupSearchFilter.trim()) {
            return [];
        }

        const distinguishedName = this._escapeSpecialCharactersInDistinguishedName(user.dn);
        const groupSearchFilter = `(&${this._groupSearchFilter}(member=${distinguishedName}))`;
        logger.debug(`Search for user groups: ${groupSearchFilter}`);
        const groupEntries = await this._ldapClient.searchGroups(groupSearchFilter);
        return groupEntries.map((e) => e.cn);
    }

    private _getRoles(request: Request, username: string, groups: Array<string>, logger: MashroomLogger): Array<string> {
        const roles: Array<string> = [];

        if (groups && groups.length > 0) {
            const groupToRoles = this._getGroupToRoleMapping(request, logger);
            if (groupToRoles) {
                groups.forEach((group) => {
                    const groupRoles = groupToRoles[group];
                    if (groupRoles && Array.isArray(groupRoles)) {
                        groupToRoles[group].forEach((role) => roles.push(role));
                    }
                });
            } else {
                // If no mapping defined treat groups as roles
                groups.forEach((g) => roles.push(g));
            }
        }

        const userToRoles = this._getUserToRoleMapping(request, logger);
        if (userToRoles) {
            const roleProp = Object.keys(userToRoles).find((u) => u.toLowerCase() === username.toLowerCase());
            if (roleProp) {
                userToRoles[roleProp].forEach((role) => {
                    if (roles.indexOf(role) === -1) {
                        roles.push(role);
                    }
                });
            }
        }

        return roles;
    }

    private _getGroupToRoleMapping(request: Request, logger: MashroomLogger): GroupToRoleMapping | undefined | null {
        if (!this._groupToRoleMappingPath) {
            return null;
        }
        if (this._groupToRoleMapping) {
            return this._groupToRoleMapping;
        }

        if (fs.existsSync(this._groupToRoleMappingPath)) {

            const groupToRoleMappingModule = require(this._groupToRoleMappingPath);
            this._groupToRoleMapping = groupToRoleMappingModule.default ?? groupToRoleMappingModule;
            this._createRoleDefinitions(this._groupToRoleMapping as GroupToRoleMapping, request, logger);
        } else {
            logger.warn(`No group to roles definition found: ${this._groupToRoleMappingPath || '-'}.`);
            this._groupToRoleMapping = null;
        }

        return this._groupToRoleMapping;
    }

    private _getUserToRoleMapping(request: Request, logger: MashroomLogger): UserToRoleMapping | undefined | null {
        if (!this._userToRoleMappingPath) {
            return null;
        }
        if (this._userToRoleMapping) {
            return this._userToRoleMapping;
        }

        if (fs.existsSync(this._userToRoleMappingPath)) {

            const userToRoleMappingModule = require(this._userToRoleMappingPath);
            this._userToRoleMapping = userToRoleMappingModule.default ?? userToRoleMappingModule;
            this._createRoleDefinitions(this._userToRoleMapping as UserToRoleMapping, request, logger);
        } else {
            logger.warn(`No user to roles definition found: ${this._userToRoleMappingPath || '-'}.`);
            this._userToRoleMapping = null;
        }

        return this._userToRoleMapping;
    }

    private async _createRoleDefinitions(mapping: GroupToRoleMapping | UserToRoleMapping, request: Request, logger: MashroomLogger): Promise<void> {
        const securityService: MashroomSecurityService = request.pluginContext.services.security!.service;
        const existingRoles = (await securityService.getExistingRoles(request)).map((def) => def.id);

        const roles: Array<string> = [];
        Object.values(mapping).forEach((mappingRoles) => {
            if (Array.isArray(mappingRoles)) {
                mappingRoles.forEach((role) => {
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

    // Escape special characters in the distinguished name.
    // See RFC 2253: https://datatracker.ietf.org/doc/html/rfc2253
    private _escapeSpecialCharactersInDistinguishedName(dn: string): string {
        return dn
            .split(',').map((rdn) => {
                const [attribute, value] = rdn.split('=');
                let escapedValue = value;
                LDAP_SPECIAL_CHARACTERS.forEach((specialChar) => {
                    escapedValue = escapedValue.replaceAll(specialChar, `\\${specialChar}`);
                });
                return `${attribute}=${escapedValue}`;
            })
            .join(',');
    }
}
