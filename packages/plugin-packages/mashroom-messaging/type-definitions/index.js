// @flow

import type {
    MashroomPluginContextHolder,
    MashroomPluginConfig,
    ExpressRequest,
} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomSecurityRoles,
    MashroomSecurityUser
} from '@mashroom/mashroom-security/type-definitions';

export type MashroomMessagingSubscriberCallback = (data: any, topic: string) => void;

/**
 * Mashroom Messaging service
 */
export interface MashroomMessagingService {
    /**
     * Subscribe to given topic.
     * Topics can be hierarchical and also can contain wildcards. Supported wildcards are + for a single level
     * and # for multiple levels. E.g. foo/+/bar or foo/#
     *
     * Throws an exception if there is no authenticated user
     */
    subscribe(req: ExpressRequest, topic: string, callback: MashroomMessagingSubscriberCallback): Promise<void>;
    /**
     * Unsubscribe from topic
     */
    unsubscribe(topic: string, callback: MashroomMessagingSubscriberCallback): Promise<void>;
    /**
     * Publish to a specific topic
     *
     * Throws an exception if there is no authenticated user
     */
    publish(req: ExpressRequest, topic: string, data: any): Promise<void>;
    /**
     * The private topic only the current user can access.
     * E.g. if the value is user/john the user john can access to user/john/whatever
     * but not to user/otheruser/foo
     *
     * Throws an exception if there is no authenticated user
     */
    getUserPrivateTopic(req: ExpressRequest): string;
    /**
     * The connect path to send publish or subscribe via WebSocket.
     * Only available if enableWebSockets is true and mashroom-websocket is preset.
     */
    getWebSocketConnectPath(req: ExpressRequest): ?string;
}

export interface MashroomMessagingInternalService {
    startListeners(): void;
    stopListeners(): void;
    subscribe(user: MashroomSecurityUser, topic: string, callback: MashroomMessagingSubscriberCallback): Promise<void>;
    unsubscribe(topic: string, callback: MashroomMessagingSubscriberCallback): Promise<void>;
    publish(user: MashroomSecurityUser, topic: string, message: any): Promise<void>;
    getUserPrivateTopic(user: MashroomSecurityUser): string;
}

export type MashroomExternalMessageListener = (topic: string, message: any) => void;

/**
 * External messaging provider plugin.
 *
 * The implementation typically subscribes to mashroom/# on the external messaging system and calls for all
 * received messages onMessage().
 * It might me necessary to translate the topic when the target system does not use / as level separator.
 * E.g. for AMQP it would be necessary to translate my/topic to my.topic (and the other way round when calling onMessage()).
 */
export interface MashroomMessagingExternalProvider {
    /**
     * Add a message listener
     * The message must be a JSON object.
     */
    addMessageListener(listener: MashroomExternalMessageListener): void;
    /**
     * Remove an existing listener
     */
    removeMessageListener(listener: MashroomExternalMessageListener): void;
    /**
     * Send a message to given external topic.
     * The passed topic must be prefixed with the topic the provider is listening to.
     * E.g. if the passed topic is foo/bar and the provider is listening to mashroom/# the message must be
     * sent to mashroom/foo/bars.
     *
     * The message will be a JSON object.
     */
    sendInternalMessage(topic: string, message: any): Promise<void>;
    /**
     * Send a message to given external topic.
     * The message will be a JSON object.
     */
    sendExternalMessage(topic: string, message: any): Promise<void>;
}

export type MashroomMessagingTopicACLRulePermission = {
    +allow?: MashroomSecurityRoles,
    +deny?: MashroomSecurityRoles
}

export type MashroomMessagingACLTopicRules = {
    +[topicPattern: string]: MashroomMessagingTopicACLRulePermission
}

export interface MashroomMessageTopicACLChecker {
    allowed(topic: string, user: ?MashroomSecurityUser): boolean;
}

export type MashroomMessagingWebSocketSubscribeRequest = {
    messageId: string,
    command: 'subscribe',
    topic: string,
}

export type MashroomMessagingWebSocketUnsubscribeRequest = {
    messageId: string,
    command: 'unsubscribe',
    topic: string,
}

export type MashroomMessagingWebSocketPublishRequest = {
    messageId: string,
    command: 'publish',
    topic: string,
    message: any,
}

export type MashroomMessagingWebSocketPublishMessage = {
    remoteMessage: true,
    topic: string,
    message: any,
}

export type MashroomMessagingWebSocketSuccessResponse = {
    messageId: string,
    success: true,
}

export type MashroomMessagingWebSocketErrorResponse = {
    messageId: string,
    error: true,
    message: string,
}

export interface MashroomMessagingWebSocketHandler {
    startListeners(): void;
    stopListeners(): void;
}

export interface MashroomExternalMessagingProviderRegistry {
    +providers: Array<MashroomMessagingExternalProvider>;
    findProvider(pluginName: string): ?MashroomMessagingExternalProvider;
    register(pluginName: string, provider: MashroomMessagingExternalProvider): void;
    unregister(pluginName: string): void;
}

/*
 * Bootstrap method definition for messaging-provider plugins
 */
export type MashroomExternalMessagingProviderPluginBootstrapFunction = (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) => Promise<MashroomMessagingExternalProvider>;

