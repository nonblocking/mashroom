// @flow

import type {
    MashroomSecurityRoles,
    MashroomSecurityUser
} from '@mashroom/mashroom-security/type-definitions';

import type {
    MashroomMessagingSubscriberCallback,
    MashroomMessagingExternalProvider
} from './api';

export interface MashroomMessagingInternalService {
    startListeners(): void;
    stopListeners(): void;
    subscribe(user: MashroomSecurityUser, topic: string, callback: MashroomMessagingSubscriberCallback): Promise<void>;
    unsubscribe(topic: string, callback: MashroomMessagingSubscriberCallback): Promise<void>;
    publish(user: MashroomSecurityUser, topic: string, message: any): Promise<void>;
    getUserPrivateTopic(user: MashroomSecurityUser): string;
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
