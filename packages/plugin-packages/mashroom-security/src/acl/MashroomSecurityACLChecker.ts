
import fs from 'fs';
import path from 'path';
// @ts-ignore
import {clientIPMatch, getClientIP} from '@mashroom/mashroom-utils/lib/ip_utils';

import type {ExpressRequest, MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {MashroomSecurityRoles, MashroomSecurityUser,} from '../../type-definitions';
import type {
    HttpMethod,
    MashroomSecurityACLChecker as MashroomSecurityACLCheckerType,
    MashroomSecurityACLHTTPMethods,
    MashroomSecurityACLPermission,
    MashroomSecurityACLPermissionRuleComplex,
    MashroomSecurityACLPermissionRules,
} from '../../type-definitions/internal';

type ACLPathRuleRegexp = {
    regexp: RegExp;
    pathRule: MashroomSecurityACLHTTPMethods;
}

export default class MashroomSecurityACLChecker implements MashroomSecurityACLCheckerType {

    private pathRuleList: Array<ACLPathRuleRegexp> | undefined | null;
    private aclPath: string;

    constructor(aclPath: string, serverRootFolder: string, loggerFactory: MashroomLoggerFactory) {
        this.aclPath = aclPath;
        if (!path.isAbsolute(this.aclPath)) {
            this.aclPath = path.resolve(serverRootFolder, this.aclPath);
        }
        this.pathRuleList = null;
        const logger = loggerFactory('mashroom.security.acl');
        logger.info(`Configured ACL definition: ${this.aclPath}`);
    }

    async allowed(req: ExpressRequest, user: MashroomSecurityUser | undefined | null): Promise<boolean> {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.security.acl');

        const path = req.path;
        const effectivePath = path.endsWith('/') ? path.substr(0, path.length - 1) : path;
        const method = req.method as HttpMethod;
        const username = user ? user.username : 'anonymous';
        const clientIP = getClientIP(req);

        logger.debug(`ACL check: url: ${path}, method: ${method}, clientIP: ${clientIP},  user: ${username}`);

        const pathRuleList = this._getPathRuleList(logger);
        const matchingRule = pathRuleList.find((r) => !!effectivePath.match(r.regexp));

        if (matchingRule) {
            const allowed = this._checkAllowed(matchingRule.pathRule, method, user, req);
            if (!allowed) {
                logger.debug(`ACL check: Access denied for user '${username}' at url '${path}' with method: '${method}'`);
            }
            return allowed;
        }

        return true;
    }

    private _checkAllowed(httpMethods: MashroomSecurityACLHTTPMethods, method: HttpMethod, user: MashroomSecurityUser | undefined | null, req: ExpressRequest): boolean {
        let permission: MashroomSecurityACLPermission = httpMethods[method];
        if (!permission) {
            permission = httpMethods['*'];
        }
        if (!permission) {
            return false;
        }

        const allowMatch = this._checkRulesMatch(user, permission.allow, req);
        const denyMatch = this._checkRulesMatch(user, permission.deny, req);

        return allowMatch && !denyMatch;
    }

    private _checkRulesMatch(user: MashroomSecurityUser | undefined | null, rules: MashroomSecurityACLPermissionRules | undefined | null, req: ExpressRequest): boolean {
        if (!rules) {
            return false;
        }
        if (typeof (rules) === 'string' && rules === 'any') {
            return true;
        }
        if (Array.isArray(rules) && user) {
            const roles: MashroomSecurityRoles = rules;
            return roles.some((r) => user.roles.find((ur) => ur === r));
        }
        if (rules.hasOwnProperty('roles') || rules.hasOwnProperty('ips')) {
            const complexRules = rules as MashroomSecurityACLPermissionRuleComplex;
            const roleMatch = user && complexRules.roles && Array.isArray(complexRules.roles) && complexRules.roles.some((r) => user.roles.find((ur) => ur === r));
            const ipMatch = complexRules.ips && Array.isArray(complexRules.ips) && clientIPMatch(req, complexRules.ips);
            return !!(roleMatch || ipMatch);
        }
        return false;
    }

    private _getPathRuleList(logger: MashroomLogger): Array<ACLPathRuleRegexp> {
        if (this.pathRuleList) {
            return this.pathRuleList;
        }

        if (fs.existsSync(this.aclPath)) {
            const pathRuleList = [];
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const acl = require(this.aclPath);
            for (const pathPattern in acl) {
                if (acl.hasOwnProperty(pathPattern)) {
                    const pathRule = acl[pathPattern];
                    if (pathPattern.startsWith('/')) {
                        const regexp = this._pathToRegExp(pathPattern);
                        pathRuleList.push({
                            pathRule,
                            regexp,
                        });
                    } else {
                        logger.error('Ignoring invalid path pattern: ', pathPattern);
                    }
                }
            }
            this.pathRuleList = pathRuleList;
        } else {
            logger.warn(`No ACL definition found: ${this.aclPath}. Disabling path based security.`);
        }

        return this.pathRuleList || [];
    }

    private _pathToRegExp(pathPattern: string): RegExp {
        let pattern = pathPattern;
        pattern = pattern.replace('/**', '(\\/.*)?');
        pattern = pattern.replace('/*', '\\/[^/]*');
        pattern = pattern.replace('/', '\\/');
        pattern = `^${pattern}$`;
        return new RegExp(pattern, 'i');
    }
}
