
// @ts-ignore
import {userContext} from '@mashroom/mashroom-utils/lib/logging_utils';
// @ts-ignore
import {topicMatcher, containsWildcard, startsWithWildcard} from '@mashroom/mashroom-utils/lib/messaging_utils';

import type {MashroomLogger, MashroomLoggerFactory, MashroomPluginService} from '@mashroom/mashroom/type-definitions';

import type {MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions'
import type {
    MashroomMessagingExternalProvider,
    MashroomMessagingSubscriberCallback,
    MashroomExternalMessageListener,
} from '../../type-definitions';
import type {
    MashroomMessagingInternalService as MashroomMessagingInternalServiceType,
    MashroomExternalMessagingProviderRegistry,
    MashroomMessageTopicACLChecker,
} from '../../type-definitions/internal';

type SubscriptionWrapper = {
    user: MashroomSecurityUser,
    topic: string,
    callback: MashroomMessagingSubscriberCallback
}

export default class MashroomMessagingInternalService implements MashroomMessagingInternalServiceType {

    private logger: MashroomLogger;
    subscriptions: Array<SubscriptionWrapper>;
    private currentProvider: MashroomMessagingExternalProvider | undefined | null;
    private boundHandleMessage: MashroomExternalMessageListener;
    private started: boolean;

    constructor(private externalMessagingProviderName: string | undefined | null, private externalMessagingProviderRegistry: MashroomExternalMessagingProviderRegistry,
                private externalTopics: Array<string>, private userPrivateBaseTopic: string, private enableWebSockets: boolean,
                private aclChecker: MashroomMessageTopicACLChecker, private pluginService: MashroomPluginService, loggerFactory: MashroomLoggerFactory) {
        this.subscriptions = [];
        this.currentProvider = null;
        this.boundHandleMessage = this.handleMessage.bind(this);
        this.started = false;
        this.logger = loggerFactory('mashroom.messaging.service');
        if (!externalMessagingProviderName) {
            this.logger.warn('No external messaging provider configured. Server side messaging within clusters is not supported!');
        }
        if (!this.isValidTopic(this.userPrivateBaseTopic, false)) {
            throw new Error(`Invalid userPrivateBaseTopic: ${this.userPrivateBaseTopic}`);
        }
        for (let i = 0; i < externalTopics.length; i++) {
            const externalTopic = externalTopics[i];
            if (!this.isValidTopic(externalTopic, false)) {
                throw new Error(`Invalid external topic: ${externalTopic}`);
            }
        }

        this.lookupProvider();
    }

    startListeners(): void {
        this.addExternalMessagingListeners();
        this.started = true;
    }

    stopListeners(): void {
        this.removeExternalMessagingListeners();
        this.started = false;
    }

    async subscribe(user: MashroomSecurityUser, topic: string, callback: MashroomMessagingSubscriberCallback): Promise<void> {
        if (!this.isValidTopic(topic, true)) {
            throw new Error(`Invalid topic (must not start or end with /, must not start with a wildcard): ${topic}`);
        }
        if (this.isExternalTopic(topic)) {
            throw new Error('It is not permitted to subscribe to external topics');
        }
        if (this.isTopicOfDifferentUser(topic, user) || !this.isTopicPermitted(topic, user)) {
            throw new Error(`User is not permitted to subscribe to ${topic}`);
        }

        const contextLogger = this.logger.withContext(userContext(user));

        contextLogger.debug(`User ${user.username} subscribes to topic: ${topic}`);

        this.unsubscribe(topic, callback);
        this.subscriptions.push({
            user,
            topic,
            callback,
        });
    }

    async unsubscribe(topic: string, callback: MashroomMessagingSubscriberCallback):  Promise<void> {
        const existing = this.subscriptions.find((wrapper) => wrapper.topic === topic && wrapper.callback === callback);
        if (existing) {
            this.logger.debug(`User ${existing.user.username} unsubscribes from topic: ${existing.topic}`);
            this.subscriptions = this.subscriptions.filter((wrapper) => wrapper !== existing);
        }
    }

    async publish(user: MashroomSecurityUser, topic: string, message: any):  Promise<void> {
        if (!this.isValidTopic(topic, false)) {
            throw new Error(`Invalid topic (must not start or end with /, no wildcards allowed): ${topic}`);
        }
        if (!this.isTopicPermitted(topic, user)) {
            throw new Error(`User is not permitted to publish to ${topic}`);
        }

        const contextLogger = this.logger.withContext(userContext(user));

        contextLogger.debug(`User ${user.username} publishes message to topic ${topic}:`, message);

        const external = this.isExternalTopic(topic);
        const provider = this.currentProvider;
        if (provider) {
            if (external) {
                this.logger.debug(`Forwarding external topic to messaging provider: ${topic}`);
                await provider.sendExternalMessage(topic, message);
            } else {
                this.logger.debug(`Forwarding internal topic to messaging provider: ${topic}`);
                await provider.sendInternalMessage(topic, message);
            }
        } else if (external) {
            throw new Error(`Cannot forward topic because there no messaging provider loaded: ${topic}`);
        } else {
            // No provider: Dispatch internally
            setTimeout(() => this.handleMessage(topic, message), 0);
        }
    }

    getUserPrivateTopic(user: MashroomSecurityUser): string {
        const safeUserName = user.username.replace(/\+/, '');
        return `${this.userPrivateBaseTopic}/${safeUserName}`;
    }

    private handleMessage(topic: string, message: any): void {
        this.logger.debug(`Received message for topic ${topic}:`, message);

        this.subscriptions.forEach((wrapper) => {
            if (topicMatcher(wrapper.topic, topic)) {
                if (this.isTopicOfDifferentUser(topic, wrapper.user) || !this.isTopicPermitted(topic, wrapper.user)) {
                    return;
                }
                this.logger.debug(`Delivering message to subscription handler: Topic ${wrapper.topic}, User: ${wrapper.user.username}`);
                wrapper.callback(message, topic);
            }
        });
    }

    private isValidTopic(topic: string, allowWildcards: boolean): boolean {
        if (!allowWildcards && containsWildcard(topic)) {
            this.logger.error(`Wildcards are not allowed`);
            return false;
        }
        if (startsWithWildcard(topic)) {
            this.logger.error(`Topics cannot start with a wildcard`);
            return false;
        }
        if (topic.startsWith('/')) {
            this.logger.error(`Topics cannot start with a slash`);
            return false;
        }
        if (topic.endsWith('/')) {
            this.logger.error(`Topics cannot end with a slash`);
            return false;
        }

        return true;
    }

    private isTopicOfDifferentUser(topic: string, user: MashroomSecurityUser): boolean {
        if (topic.startsWith(`${this.userPrivateBaseTopic}/`) &&
            topic !== this.getUserPrivateTopic(user) && !topic.startsWith(`${this.getUserPrivateTopic(user)}/`)) {
            this.logger.error(`Not permitted to receive topics from different user. Topic: ${topic}. Authenticated user: ${user.username}`);
            return true;
        }
        return false;
    }

    private isTopicPermitted(topic: string, user: MashroomSecurityUser): boolean {
        if (!this.aclChecker.allowed(topic, user)) {
            this.logger.error(`Topic not permitted for authenticated user ${user.username}: ${topic}`);
            return false;
        }
        return true;
    }

    private isExternalTopic(topic: string): boolean {
        return this.externalTopics.some((et) => topic === et || topic.startsWith(`${et}/`));
    }

    private addExternalMessagingListeners(): void {
        const provider = this.currentProvider;
        if (provider) {
            this.logger.info(`Using External Messaging Provider: ${this.externalMessagingProviderName || '<none>'}`);
            provider.addMessageListener(this.boundHandleMessage);
        }
    }

    private removeExternalMessagingListeners(): void {
        const provider = this.currentProvider;
        if (provider) {
            this.logger.info(`Disabling External Messaging Provider: ${this.externalMessagingProviderName || '<none>'}`);
            provider.removeMessageListener(this.boundHandleMessage);
        }
    }

    private onExternalProviderLoaded(): void {
        const externalProviderName = this.externalMessagingProviderName;
        if (externalProviderName) {
            this.currentProvider = this.externalMessagingProviderRegistry.findProvider(externalProviderName);
            if (this.started) {
                this.addExternalMessagingListeners();
            }
            this.pluginService.onLoadedOnce(externalProviderName, () => this.onExternalProviderLoaded());
        }
    }

    private onExternalProviderUnload(): void {
        const externalProviderName = this.externalMessagingProviderName;
        if (externalProviderName) {
            if (this.started) {
                this.removeExternalMessagingListeners();
                this.currentProvider = null;
            }
            this.pluginService.onUnloadOnce(externalProviderName, () => this.onExternalProviderUnload());
        }
    }

    private lookupProvider(): void {
        const externalProviderName = this.externalMessagingProviderName;
        if (externalProviderName) {
            this.currentProvider = this.externalMessagingProviderRegistry.findProvider(externalProviderName);
            this.pluginService.onLoadedOnce(externalProviderName, () => this.onExternalProviderLoaded());
            this.pluginService.onUnloadOnce(externalProviderName, () => this.onExternalProviderUnload());
        }
    }

}

