
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

    _logger: MashroomLogger;
    _subscriptions: Array<SubscriptionWrapper>;
    _currentProvider: MashroomMessagingExternalProvider | undefined | null;
    _boundHandleMessage: MashroomExternalMessageListener;
    _started: boolean;

    constructor(private externalMessagingProviderName: string | undefined | null, private externalMessagingProviderRegistry: MashroomExternalMessagingProviderRegistry,
                private externalTopics: Array<string>, private userPrivateBaseTopic: string, private enableWebSockets: boolean,
                private aclChecker: MashroomMessageTopicACLChecker, private pluginService: MashroomPluginService, loggerFactory: MashroomLoggerFactory) {
        this._subscriptions = [];
        this._currentProvider = null;
        this._boundHandleMessage = this._handleMessage.bind(this);
        this._started = false;
        this._logger = loggerFactory('mashroom.messaging.service');
        if (!externalMessagingProviderName) {
            this._logger.warn('No external messaging provider configured. Server side messaging within clusters is not supported!');
        }
        if (!this._isValidTopic(this.userPrivateBaseTopic, false)) {
            throw new Error(`Invalid userPrivateBaseTopic: ${this.userPrivateBaseTopic}`);
        }
        for (let i = 0; i < externalTopics.length; i++) {
            const externalTopic = externalTopics[i];
            if (!this._isValidTopic(externalTopic, false)) {
                throw new Error(`Invalid external topic: ${externalTopic}`);
            }
        }

        this._lookupProvider();
    }

    startListeners(): void {
        this._addExternalMessagingListeners();
        this._started = true;
    }

    stopListeners(): void {
        this._removeExternalMessagingListeners();
        this._started = false;
    }

    async subscribe(user: MashroomSecurityUser, topic: string, callback: MashroomMessagingSubscriberCallback): Promise<void> {
        if (!this._isValidTopic(topic, true)) {
            throw new Error(`Invalid topic (must not start or end with /, must not start with a wildcard): ${topic}`);
        }
        if (this._isExternalTopic(topic)) {
            throw new Error('It is not permitted to subscribe to external topics');
        }
        if (this._isTopicOfDifferentUser(topic, user) || !this._isTopicPermitted(topic, user)) {
            throw new Error(`User is not permitted to subscribe to ${topic}`);
        }

        const contextLogger = this._logger.withContext(userContext(user));

        contextLogger.debug(`User ${user.username} subscribes to topic: ${topic}`);

        this.unsubscribe(topic, callback);
        this._subscriptions.push({
            user,
            topic,
            callback,
        });
    }

    async unsubscribe(topic: string, callback: MashroomMessagingSubscriberCallback):  Promise<void> {
        const existing = this._subscriptions.find((wrapper) => wrapper.topic === topic && wrapper.callback === callback);
        if (existing) {
            this._logger.debug(`User ${existing.user.username} unsubscribes from topic: ${existing.topic}`);
            this._subscriptions = this._subscriptions.filter((wrapper) => wrapper !== existing);
        }
    }

    async publish(user: MashroomSecurityUser, topic: string, message: any):  Promise<void> {
        if (!this._isValidTopic(topic, false)) {
            throw new Error(`Invalid topic (must not start or end with /, no wildcards allowed): ${topic}`);
        }
        if (!this._isTopicPermitted(topic, user)) {
            throw new Error(`User is not permitted to publish to ${topic}`);
        }

        const contextLogger = this._logger.withContext(userContext(user));

        contextLogger.debug(`User ${user.username} publishes message to topic ${topic}:`, message);

        const external = this._isExternalTopic(topic);
        const provider = this._currentProvider;
        if (provider) {
            if (external) {
                this._logger.debug(`Forwarding external topic to messaging provider: ${topic}`);
                await provider.sendExternalMessage(topic, message);
            } else {
                this._logger.debug(`Forwarding internal topic to messaging provider: ${topic}`);
                await provider.sendInternalMessage(topic, message);
            }
        } else if (external) {
            throw new Error(`Cannot forward topic because there no messaging provider loaded: ${topic}`);
        } else {
            // No provider: Dispatch internally
            setTimeout(() => this._handleMessage(topic, message), 0);
        }
    }

    getUserPrivateTopic(user: MashroomSecurityUser): string {
        const safeUserName = user.username.replace(/\+/, '');
        return `${this.userPrivateBaseTopic}/${safeUserName}`;
    }

    private _handleMessage(topic: string, message: any): void {
        this._logger.debug(`Received message for topic ${topic}:`, message);

        this._subscriptions.forEach((wrapper) => {
            if (topicMatcher(wrapper.topic, topic)) {
                if (this._isTopicOfDifferentUser(topic, wrapper.user) || !this._isTopicPermitted(topic, wrapper.user)) {
                    return;
                }
                this._logger.debug(`Delivering message to subscription handler: Topic ${wrapper.topic}, User: ${wrapper.user.username}`);
                wrapper.callback(message, topic);
            }
        });
    }

    private _isValidTopic(topic: string, allowWildcards: boolean): boolean {
        if (!allowWildcards && containsWildcard(topic)) {
            this._logger.error(`Wildcards are not allowed`);
            return false;
        }
        if (startsWithWildcard(topic)) {
            this._logger.error(`Topics cannot start with a wildcard`);
            return false;
        }
        if (topic.startsWith('/')) {
            this._logger.error(`Topics cannot start with a slash`);
            return false;
        }
        if (topic.endsWith('/')) {
            this._logger.error(`Topics cannot end with a slash`);
            return false;
        }

        return true;
    }

    private _isTopicOfDifferentUser(topic: string, user: MashroomSecurityUser): boolean {
        if (topic.startsWith(`${this.userPrivateBaseTopic}/`) &&
            topic !== this.getUserPrivateTopic(user) && !topic.startsWith(`${this.getUserPrivateTopic(user)}/`)) {
            this._logger.error(`Not permitted to receive topics from different user. Topic: ${topic}. Authenticated user: ${user.username}`);
            return true;
        }
        return false;
    }

    private _isTopicPermitted(topic: string, user: MashroomSecurityUser): boolean {
        if (!this.aclChecker.allowed(topic, user)) {
            this._logger.error(`Topic not permitted for authenticated user ${user.username}: ${topic}`);
            return false;
        }
        return true;
    }

    private _isExternalTopic(topic: string): boolean {
        return this.externalTopics.some((et) => topic === et || topic.startsWith(`${et}/`));
    }

    private _addExternalMessagingListeners(): void {
        const provider = this._currentProvider;
        if (provider) {
            this._logger.info(`Using External Messaging Provider: ${this.externalMessagingProviderName || '<none>'}`);
            provider.addMessageListener(this._boundHandleMessage);
        }
    }

    private _removeExternalMessagingListeners(): void {
        const provider = this._currentProvider;
        if (provider) {
            this._logger.info(`Disabling External Messaging Provider: ${this.externalMessagingProviderName || '<none>'}`);
            provider.removeMessageListener(this._boundHandleMessage);
        }
    }

    private _onExternalProviderLoaded(): void {
        const externalProviderName = this.externalMessagingProviderName;
        if (externalProviderName) {
            this._currentProvider = this.externalMessagingProviderRegistry.findProvider(externalProviderName);
            if (this._started) {
                this._addExternalMessagingListeners();
            }
            this.pluginService.onLoadedOnce(externalProviderName, () => this._onExternalProviderLoaded());
        }
    }

    private _onExternalProviderUnload(): void {
        const externalProviderName = this.externalMessagingProviderName;
        if (externalProviderName) {
            if (this._started) {
                this._removeExternalMessagingListeners();
                this._currentProvider = null;
            }
            this.pluginService.onUnloadOnce(externalProviderName, () => this._onExternalProviderUnload());
        }
    }

    private _lookupProvider(): void {
        const externalProviderName = this.externalMessagingProviderName;
        if (externalProviderName) {
            this._currentProvider = this.externalMessagingProviderRegistry.findProvider(externalProviderName);
            this.pluginService.onLoadedOnce(externalProviderName, () => this._onExternalProviderLoaded());
            this.pluginService.onUnloadOnce(externalProviderName, () => this._onExternalProviderUnload());
        }
    }

}

