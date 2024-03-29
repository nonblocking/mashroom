
import type {Request} from 'express';
import type {
    MashroomPluginContextHolder,
    MashroomPluginConfig,
} from '@mashroom/mashroom/type-definitions';

export type MashroomMessagingSubscriberCallback = (data: any, topic: string) => void;

export type MashroomMessagingWebSocketSubscribeRequest = {
    readonly messageId: string;
    readonly command: 'subscribe';
    readonly topic: string;
}

export type MashroomMessagingWebSocketUnsubscribeRequest = {
    readonly messageId: string;
    readonly command: 'unsubscribe';
    readonly topic: string;
}

export type MashroomMessagingWebSocketPublishRequest = {
    readonly messageId: string;
    readonly command: 'publish';
    readonly topic: string;
    readonly message: any;
}

export type MashroomMessagingWebSocketPublishMessage = {
    readonly remoteMessage: true;
    readonly subscriptionPattern: string;
    readonly topic: string;
    readonly message: any;
}

export type MashroomMessagingWebSocketSuccessResponse = {
    readonly messageId: string;
    readonly success: true;
}

export type MashroomMessagingWebSocketErrorResponse = {
    readonly messageId: string;
    readonly error: true;
    readonly message: string;
}

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
    subscribe(req: Request, topic: string, callback: MashroomMessagingSubscriberCallback): Promise<void>;

    /**
     * Unsubscribe from topic
     */
    unsubscribe(topic: string, callback: MashroomMessagingSubscriberCallback): Promise<void>;

    /**
     * Publish to a specific topic
     *
     * Throws an exception if there is no authenticated user
     */
    publish(req: Request, topic: string, data: any): Promise<void>;

    /**
     * The private topic only the current user can access.
     * E.g. if the value is user/john the user john can access to user/john/whatever
     * but not to user/otheruser/foo
     *
     * Throws an exception if there is no authenticated user
     */
    getUserPrivateTopic(req: Request): string;

    /**
     * The connect path to send publish or subscribe via WebSocket.
     * Only available if enableWebSockets is true and mashroom-websocket is preset.
     */
    getWebSocketConnectPath(req: Request): string | null | undefined;
}

export type MashroomExternalMessageListener = (topic: string, message: any) => void;

/**
 * External messaging provider plugin.
 *
 * The implementation typically subscribes to mashroom/# on the external messaging system and calls for all
 * received messages onMessage().
 * It might be necessary to translate the topic when the target system does not use / as level separator.
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
     * Send a message to given internal topic.
     * Used to broadcast message between Mashroom instances.
     *
     * The passed topic must be prefixed with the topic the provider is listening to.
     * E.g. if the passed topic is foo/bar and the provider is listening to mashroom/# the message must be
     * sent to mashroom/foo/bars.
     *
     * The message will be a JSON object.
     */
    sendInternalMessage(topic: string, message: any): Promise<void>;

    /**
     * Send a message to given external topic.
     * Used to send messages to 3rd party systems.
     *
     * The message will be a JSON object.
     */
    sendExternalMessage(topic: string, message: any): Promise<void>;
}

/*
 * Bootstrap method definition for messaging-provider plugins
 */
export type MashroomExternalMessagingProviderPluginBootstrapFunction = (
    pluginName: string,
    pluginConfig: MashroomPluginConfig,
    contextHolder: MashroomPluginContextHolder,
) => Promise<MashroomMessagingExternalProvider>;
