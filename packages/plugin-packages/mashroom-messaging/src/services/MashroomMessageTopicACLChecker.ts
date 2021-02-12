
import fs from 'fs';
import path from 'path';
// @ts-ignore
import {topicMatcher} from '@mashroom/mashroom-utils/lib/messaging_utils';

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

    private aclPath: string;
    private logger: MashroomLogger;
    private rules: Rules | undefined | null;

    constructor(aclPath: string, serverRootFolder: string, loggerFactory: MashroomLoggerFactory) {
        this.aclPath = aclPath;
        if (!path.isAbsolute(this.aclPath)) {
            this.aclPath = path.resolve(serverRootFolder, this.aclPath);
        }
        this.logger = loggerFactory('mashroom.messaging.service.acl');
        this.logger.info(`Configured Topic ACL definition: ${this.aclPath}`);
    }

    allowed(topic: string, user: MashroomSecurityUser | null | undefined): boolean {
        const rules = this.getRuleList();
        const matchingRule = rules.find((r) => topicMatcher(r.topic, topic));
        if (matchingRule) {
            const allowMatch = this.checkRulesMatch(user, matchingRule.allow);
            const denyMatch = this.checkRulesMatch(user, matchingRule.deny);
            return allowMatch && !denyMatch;
        }

        return true;
    }

    private checkRulesMatch(user:  MashroomSecurityUser | null | undefined, rules: MashroomSecurityRoles | string | undefined | null): boolean {
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

    private getRuleList(): Rules {
        if (this.rules) {
            return this.rules;
        }

        if (fs.existsSync(this.aclPath)) {
            const rules: Rules = [];
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const aclData: MashroomMessagingACLTopicRules = require(this.aclPath);
            for (const topic in aclData) {
                if (aclData.hasOwnProperty(topic)) {
                    try {
                        rules.push({
                            topic,
                            allow: aclData[topic].allow,
                            deny: aclData[topic].deny,
                        });
                    } catch (error) {
                        this.logger.error(`Invalid ACL rule for topic ${topic}:` , aclData[topic]);
                    }
                }
            }
            this.rules = rules;
        } else {
            this.logger.warn(`No Topic ACL definition found: ${this.aclPath}. ACL security disabled.`);
            this.rules = [];
        }
        return this.rules;
    }

}
