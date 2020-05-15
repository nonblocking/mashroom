// @flow

import fs from 'fs';
import path from 'path';
import {topicMatcher} from '@mashroom/mashroom-utils/lib/messaging_utils';

import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {MashroomSecurityRoles, MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';
import type {
    MashroomMessageTopicACLChecker as MashroomMessageTopicACLCheckerType, MashroomMessagingACLTopicRules,
} from '../../type-definitions/internal';

type Rules = Array<{
    topic: string,
    allow: ?MashroomSecurityRoles,
    deny: ?MashroomSecurityRoles
}>;

export default class MashroomMessageTopicACLChecker implements MashroomMessageTopicACLCheckerType {

    _aclPath: string;
    _logger: MashroomLogger;
    _rules: ?Rules;

    constructor(aclPath: string, serverRootFolder: string, loggerFactory: MashroomLoggerFactory) {
        this._aclPath = aclPath;
        if (!path.isAbsolute(this._aclPath)) {
            this._aclPath = path.resolve(serverRootFolder, this._aclPath);
        }
        this._logger = loggerFactory('mashroom.messaging.service.acl');
        this._logger.info(`Configured Topic ACL definition: ${this._aclPath}`);
    }

    allowed(topic: string, user: ?MashroomSecurityUser) {
        const rules = this._getRuleList();
        const matchingRule = rules.find((r) => topicMatcher(r.topic, topic));
        if (matchingRule) {
            const allowMatch = matchingRule.allow && Array.isArray(matchingRule.allow) && matchingRule.allow.find((r) => user && user.roles.find((upr) => upr === r || upr === '*'));
            const denyMatch = matchingRule.deny && Array.isArray(matchingRule.deny) && matchingRule.deny.find((r) => user && user.roles.find((upr) => upr === r || upr === '*'));

            return !!(allowMatch && !denyMatch);
        }

        return true;
    }

    _getRuleList(): Rules {
        if (this._rules) {
            return this._rules;
        }

        if (fs.existsSync(this._aclPath)) {
            const rules: Rules = [];
            const aclData: MashroomMessagingACLTopicRules = require(this._aclPath);
            for (const topic in aclData) {
                if (aclData.hasOwnProperty(topic)) {
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
