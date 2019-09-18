// @flow

import {userContext} from '@mashroom/mashroom-utils/lib/logging_utils';
import {topicMatcher, containsWildcard, startsWithWildcard} from '@mashroom/mashroom-utils/lib/messaging_utils';

import type {MashroomLogger, MashroomLoggerFactory, MashroomPluginService} from '@mashroom/mashroom/type-definitions';

import type {MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions'
import type {
    MashroomMessagingInternalService as MashroomMessagingInternalServiceType,
    MashroomMessagingExternalProvider,
    MashroomExternalMessagingProviderRegistry,
    MashroomMessagingSubscriberCallback,
    MashroomMessageTopicACLChecker,
    MashroomExternalMessageListener,
} from '../../type-definitions';

type SubscriptionWrapper = {
    user: MashroomSecurityUser,
    topic: string,
    callback: MashroomMessagingSubscriberCallback
}

export default class MashroomMessagingInternalService implements MashroomMessagingInternalServiceType {

    _externalMessagingProviderRegistry: MashroomExternalMessagingProviderRegistry;
    _externalMessagingProviderName: ?string;
    _externalTopics: Array<string>;
    _userPrivateBaseTopic: string;
    _enableWebSockets: boolean;
    _aclChecker: MashroomMessageTopicACLChecker;
    _pluginService: MashroomPluginService;
    _logger: MashroomLogger;
    _subscriptions: Array<SubscriptionWrapper>;
    _currentProvider: ?MashroomMessagingExternalProvider;
    _boundHandleMessage: MashroomExternalMessageListener;
    _started: boolean;

    constructor(externalMessagingProviderName: ?string, externalMessagingProviderRegistry: MashroomExternalMessagingProviderRegistry,
                externalTopics: Array<string>, userPrivateBaseTopic: string, enableWebSockets: boolean,
                aclChecker: MashroomMessageTopicACLChecker, pluginService: MashroomPluginService, loggerFactory: MashroomLoggerFactory) {
        this._externalMessagingProviderName = externalMessagingProviderName;
        this._externalMessagingProviderRegistry = externalMessagingProviderRegistry;
        this._externalTopics = externalTopics;
        this._enableWebSockets = enableWebSockets;
        this._aclChecker = aclChecker;
        this._userPrivateBaseTopic = userPrivateBaseTopic;
        this._pluginService = pluginService;
        this._subscriptions = [];
        this._currentProvider = null;
        this._boundHandleMessage = this._handleMessage.bind(this);
        this._started = false;
        this._logger = loggerFactory('mashroom.messaging.service');
        if (!this._externalMessagingProviderName) {
            this._logger.warn('No external messaging provider configured. Server side messaging within clusters is not supported!');
        }

        if (!this._isValidTopic(this._userPrivateBaseTopic, false)) {
            throw new Error(`Invalid userPrivateBaseTopic: ${this._userPrivateBaseTopic}`);
        }
        for (let i = 0; i < this._externalTopics.length; i++) {
            const externalTopic = this._externalTopics[i];
            if (!this._isValidTopic(externalTopic, false)) {
                throw new Error(`Invalid external topic: ${externalTopic}`);
            }
        }

        this._lookupProvider();
    }

    startListeners() {
        this._addExternalMessagingListeners();
        this._started = true;
    }

    stopListeners() {
        this._removeExternalMessagingListeners();
        this._started = false;
    }

    async subscribe(user: MashroomSecurityUser, topic: string, callback: MashroomMessagingSubscriberCallback) {
        const contextLogger = this._logger.withContext(userContext(user));
        if (!this._isValidTopic(topic, true)) {
            throw new Error(`Invalid topic (must not start or end with /, must not start with a wildcard): ${topic}`);
        }
        if (this._isExternalTopic(topic)) {
            throw new Error('It is not permitted to subscribe to external topics');
        }
        if (this._isTopicOfDifferentUser(topic, user) || !this._isTopicPermitted(topic, user)) {
            throw new Error(`User is not permitted to subscribe to ${topic}`);
        }

        contextLogger.debug(`User ${user.username} subscribes to topic: ${topic}`);

        this.unsubscribe(topic, callback);
        this._subscriptions.push({
            user,
            topic,
            callback,
        });
    }

    async unsubscribe(topic: string, callback: MashroomMessagingSubscriberCallback) {
        const existing = this._subscriptions.find((wrapper) => wrapper.topic === topic && wrapper.callback === callback);
        if (existing) {
            this._logger.debug(`User ${existing.user.username} unsubscribes from topic: ${existing.topic}`);
            this._subscriptions = this._subscriptions.filter((wrapper) => wrapper !== existing);
        }
    }

    async publish(user: MashroomSecurityUser, topic: string, message: any) {
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

    getUserPrivateTopic(user: MashroomSecurityUser) {
        const safeUserName = user.username.replace(/\+/, '');
        return `${this._userPrivateBaseTopic}/${safeUserName}`;
    }

    _handleMessage(topic: string, message: any) {
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

    _isValidTopic(topic: string, allowWildcards: boolean) {
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

    _isTopicOfDifferentUser(topic: string, user: MashroomSecurityUser) {
        if (topic.startsWith(`${this._userPrivateBaseTopic}/`) &&
            topic !== this.getUserPrivateTopic(user) && !topic.startsWith(`${this.getUserPrivateTopic(user)}/`)) {
            this._logger.error(`Not permitted to receive topics from different user. Topic: ${topic}. Authenticated user: ${user.username}`);
            return true;
        }
        return false;
    }

    _isTopicPermitted(topic: string, user: MashroomSecurityUser) {
        if (!this._aclChecker.allowed(topic, user)) {
            this._logger.error(`Topic not permitted for authenticated user ${user.username}: ${topic}`);
            return false;
        }
        return true;
    }

    _isExternalTopic(topic: string) {
        return this._externalTopics.some((et) => topic === et || topic.startsWith(`${et}/`));
    }

    _addExternalMessagingListeners() {
        const provider = this._currentProvider;
        if (provider) {
            this._logger.info(`Using External Messaging Provider: ${this._externalMessagingProviderName || '<none>'}`);
            provider.addMessageListener(this._boundHandleMessage);
        }
    }

    _removeExternalMessagingListeners() {
        const provider = this._currentProvider;
        if (provider) {
            this._logger.info(`Disabling External Messaging Provider: ${this._externalMessagingProviderName || '<none>'}`);
            provider.removeMessageListener(this._boundHandleMessage);
        }
    }

    _onExternalProviderLoaded() {
        const externalProviderName = this._externalMessagingProviderName;
        if (externalProviderName) {
            this._currentProvider = this._externalMessagingProviderRegistry.findProvider(externalProviderName);
            if (this._started) {
                this._addExternalMessagingListeners();
            }
            this._pluginService.onLoadedOnce(externalProviderName, () => this._onExternalProviderLoaded());
        }
    }

    _onExternalProviderUnload() {
        const externalProviderName = this._externalMessagingProviderName;
        if (externalProviderName) {
            if (this._started) {
                this._removeExternalMessagingListeners();
                this._currentProvider = null;
            }
            this._pluginService.onUnloadOnce(externalProviderName, () => this._onExternalProviderUnload());
        }
    }

    _lookupProvider() {
        const externalProviderName = this._externalMessagingProviderName;
        if (externalProviderName) {
            this._currentProvider = this._externalMessagingProviderRegistry.findProvider(externalProviderName);
            this._pluginService.onLoadedOnce(externalProviderName, () => this._onExternalProviderLoaded());
            this._pluginService.onUnloadOnce(externalProviderName, () => this._onExternalProviderUnload());
        }
    }

}

