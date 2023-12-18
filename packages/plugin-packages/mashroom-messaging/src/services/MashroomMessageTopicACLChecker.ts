
import fs from 'fs';
import path from 'path';
import {messagingUtils} from '@mashroom/mashroom-utils';

import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {MashroomSecurityRoles, MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';
import type {
    MashroomMessageTopicACLChecker as MashroomMessageTopicACLCheckerType, MashroomMessagingACLTopicRules,
} from '../../type-definitions/internal';

type Rules = Array<{
    topic: string,
    allow: MashroomSecurityRoles | string | undefined | null,
    deny: MashroomSecurityRoles | string | undefined | null
}>;

export default class MashroomMessageTopicACLChecker implements MashroomMessageTopicACLCheckerType {

    private _aclPath: string;
    private _logger: MashroomLogger;
    private _rules: Rules | undefined | null;

    constructor(aclPath: string, serverRootFolder: string, loggerFactory: MashroomLoggerFactory) {
        this._aclPath = aclPath;
        if (!path.isAbsolute(this._aclPath)) {
            this._aclPath = path.resolve(serverRootFolder, this._aclPath);
        }
        this._logger = loggerFactory('mashroom.messaging.service.acl');
        this._logger.info(`Configured Topic ACL definition: ${this._aclPath}`);
    }

    allowed(topic: string, user: MashroomSecurityUser | null | undefined): boolean {
        const rules = this._getRuleList();
        const matchingRule = rules.find((r) => messagingUtils.topicMatcher(r.topic, topic));
        if (matchingRule) {
            const allowMatch = this._checkRulesMatch(user, matchingRule.allow);
            const denyMatch = this._checkRulesMatch(user, matchingRule.deny);
            return allowMatch && !denyMatch;
        }

        return true;
    }

    private _checkRulesMatch(user:  MashroomSecurityUser | null | undefined, rules: MashroomSecurityRoles | string | undefined | null): boolean {
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
        return false;
    }

    private _getRuleList(): Rules {
        if (this._rules) {
            return this._rules;
        }

        if (fs.existsSync(this._aclPath)) {
            const rules: Rules = [];
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const aclDataModule = require(this._aclPath);
            const aclData: MashroomMessagingACLTopicRules = aclDataModule.default ?? aclDataModule;
            for (const topic in aclData) {
                if (aclData.hasOwnProperty(topic) && !topic.startsWith('$')) {
                    try {
                        rules.push({
                            topic,
                            allow: aclData[topic].allow,
                            deny: aclData[topic].deny,
                        });
                    } catch (error) {
                        this._logger.error(`Invalid ACL rule for topic ${topic}:` , aclData[topic]);
                    }
                }
            }
            this._rules = rules;
        } else {
            this._logger.warn(`No Topic ACL definition found: ${this._aclPath}. ACL security disabled.`);
            this._rules = [];
        }
        return this._rules;
    }

}
