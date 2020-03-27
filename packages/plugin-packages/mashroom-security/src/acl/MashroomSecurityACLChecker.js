// @flow

import fs from 'fs';
import path from 'path';

import type {
    ExpressRequest,
    MashroomLogger,
    MashroomLoggerFactory
} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomSecurityRoles,
    MashroomSecurityUser,
} from '../../type-definitions';
import type {
    MashroomSecurityACLChecker as MashroomSecurityACLCheckerType,
    MashroomSecurityACLPathRule,
    MashroomSecurityACLPathRulePermission,
    HttpMethod,
} from '../../type-definitions/internal';

type ACLPathRuleRegexp = {
    regexp: RegExp,
    pathRule: MashroomSecurityACLPathRule,
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

        logger.debug(`ACL check: url: ${path}, method: ${method}, user: ${username}`);

        const pathRuleList = this._getPathRuleList(logger);
        const matchingRule = pathRuleList.find((r) => !!effectivePath.match(r.regexp));

        if (matchingRule) {
            const allowed = this._checkRule(matchingRule.pathRule, method, user);
            if (!allowed) {
                logger.debug(`ACL check: Access denied for user '${username}' at url '${path}' with method: '${method}'`);
            }
            return allowed;
        }

        return true;
    }

    _checkRule(rule: MashroomSecurityACLPathRule, method: HttpMethod, user: ?MashroomSecurityUser): boolean {
        let permission: MashroomSecurityACLPathRulePermission = rule[method];
        if (!permission) {
            permission = rule['*'];
        }
        if (!permission) {
            return false;
        }

        const allowMatch = this._checkRolePermission(user, permission.allow);
        const denyMatch = this._checkRolePermission(user, permission.deny);

        return allowMatch && !denyMatch;
    }

    _checkRolePermission(user: ?MashroomSecurityUser, roles: void | MashroomSecurityRoles | '*'): boolean {
        if (roles === '*') {
            return true;
        }
        if (user && Array.isArray(roles)) {
            return !!roles.find((r) => user.roles.find((ur) => ur === r));
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
