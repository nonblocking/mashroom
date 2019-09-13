// @flow

import fs from 'fs';
import path from 'path';

import type {ExpressRequest, MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomSecurityACLChecker as MashroomSecurityACLCheckerType,
    MashroomSecurityACLPathRule,
    MashroomSecurityACLPathRulePermission,
    HttpMethod,
    MashroomSecurityUser,
} from '../../type-definitions';

type ACLPathRuleRegexp = {
    regexp: RegExp,
    pathRule: MashroomSecurityACLPathRule,
}

export default class MashroomSecurityACLChecker implements MashroomSecurityACLCheckerType {

    _pathRuleList: ?Array<ACLPathRuleRegexp>;
    _aclPath: string;
    _logger: MashroomLogger;

    constructor(aclPath: string, serverRootFolder: string, loggerFactory: MashroomLoggerFactory) {
        this._aclPath = aclPath;
        if (!path.isAbsolute(this._aclPath)) {
            this._aclPath = path.resolve(serverRootFolder, this._aclPath);
        }
        this._pathRuleList = null;
        this._logger = loggerFactory('mashroom.security.acl');
        this._logger.info(`Configured ACL definition: ${this._aclPath}`);
    }

    async allowed(req: ExpressRequest, user: ?MashroomSecurityUser) {
        const path = req.path;
        const effectivePath = path.endsWith('/') ? path.substr(0, path.length - 1) : path;
        const method = req.method;
        const username = user ? user.username : 'anonymous';

        this._logger.debug(`ACL check: url: ${path}, method: ${method}, user: ${username}`);

        const pathRuleList = this._getPathRuleList();
        const matchingRule = pathRuleList.find((r) => !!effectivePath.match(r.regexp));

        if (matchingRule) {
            const allowed = this._checkRule(matchingRule.pathRule, method, user);
            if (!allowed) {
                this._logger.debug(`ACL check: Access denied for user '${username}' at url '${path}' with method: '${method}'`);
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

        const allowMatch = permission.allow && Array.isArray(permission.allow) && permission.allow.find((r) => user && user.roles.find((upr) => upr === r || upr === '*'));
        const denyMatch = permission.deny && Array.isArray(permission.deny) && permission.deny.find((r) => user && user.roles.find((upr) => upr === r || upr === '*'));

        return !!(allowMatch && !denyMatch);
    }

    _getPathRuleList(): Array<ACLPathRuleRegexp> {
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
                        this._logger.error('Ignoring invalid path pattern: ', pathPattern);
                    }
                }
            }
            this._pathRuleList = pathRuleList;
        } else {
            this._logger.warn(`No ACL definition found: ${this._aclPath}. Disabling path based security.`);
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
