// @flow

import fs from 'fs';
import path from 'path';
import {getClientIP, clientIPMatch} from '@mashroom/mashroom-utils/lib/ip_utils';

import type {
    ExpressRequest,
    MashroomLogger,
    MashroomLoggerFactory
} from '@mashroom/mashroom/type-definitions';
import type {MashroomSecurityRoles, MashroomSecurityUser,} from '../../type-definitions';
import type {
    HttpMethod,
    MashroomSecurityACLChecker as MashroomSecurityACLCheckerType,
    MashroomSecurityACLHTTPMethods,
    MashroomSecurityACLPermission,
    MashroomSecurityACLPermissionRules,
    MashroomSecurityACLPermissionRuleComplex,
} from '../../type-definitions/internal';

type ACLPathRuleRegexp = {
    regexp: RegExp,
    pathRule: MashroomSecurityACLHTTPMethods,
}

export default class MashroomSecurityACLChecker implements MashroomSecurityACLCheckerType {

    _pathRuleList: ?Array<ACLPathRuleRegexp>;
    _aclPath: string;

    constructor(aclPath: string, serverRootFolder: string, loggerFactory: MashroomLoggerFactory) {
        this._aclPath = aclPath;
        if (!path.isAbsolute(this._aclPath)) {
            this._aclPath = path.resolve(serverRootFolder, this._aclPath);
        }
        this._pathRuleList = null;
        const logger = loggerFactory('mashroom.security.acl');
        logger.info(`Configured ACL definition: ${this._aclPath}`);
    }

    async allowed(req: ExpressRequest, user: ?MashroomSecurityUser) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.security.acl');

        const path = req.path;
        const effectivePath = path.endsWith('/') ? path.substr(0, path.length - 1) : path;
        const method = req.method;
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

    _checkAllowed(httpMethods: MashroomSecurityACLHTTPMethods, method: HttpMethod, user: ?MashroomSecurityUser, req: ExpressRequest): boolean {
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

    _checkRulesMatch(user: ?MashroomSecurityUser, rules: ?MashroomSecurityACLPermissionRules, req: ExpressRequest): boolean {
        if (!rules) {
            return false;
        }
        if (typeof(rules) === 'string' && rules === 'any') {
            return true;
        }
        if (Array.isArray(rules) && user) {
            const roles: MashroomSecurityRoles = rules;
            return roles.some((r) => user.roles.find((ur) => ur === r));
        }
        if (rules.roles || rules.ips) {
            const complexRules: MashroomSecurityACLPermissionRuleComplex = (rules: any);
            const roleMatch = user && complexRules.roles && Array.isArray(complexRules.roles) && complexRules.roles.some((r) => user.roles.find((ur) => ur === r));
            const ipMatch = complexRules.ips && Array.isArray(complexRules.ips) && clientIPMatch(req, complexRules.ips);
            return !!(roleMatch || ipMatch);
        }
        return false;
    }

    _getPathRuleList(logger: MashroomLogger): Array<ACLPathRuleRegexp> {
        if (this._pathRuleList) {
            return this._pathRuleList;
        }

        if (fs.existsSync(this._aclPath)) {
            const pathRuleList = [];
            const acl = require(this._aclPath);
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
            this._pathRuleList = pathRuleList;
        } else {
            logger.warn(`No ACL definition found: ${this._aclPath}. Disabling path based security.`);
        }

        return this._pathRuleList || [];
    }

    _pathToRegExp(pathPattern: string): RegExp {
        let pattern = pathPattern;
        pattern = pattern.replace('/**', '(\\/.*)?');
        pattern = pattern.replace('/*', '\\/[^/]*');
        pattern = pattern.replace('/', '\\/');
        pattern = '^' + pattern + '$';
        return new RegExp(pattern, 'i');
    }
}
