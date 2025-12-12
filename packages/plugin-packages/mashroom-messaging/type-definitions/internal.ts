
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
    readonly allow?: MashroomSecurityRoles,
    readonly deny?: MashroomSecurityRoles
}

export type MashroomMessagingACLTopicRules = {
    readonly [topicPattern: string]: MashroomMessagingTopicACLRulePermission
}

export interface MashroomMessageTopicACLChecker {
    allowed(topic: string, user: MashroomSecurityUser | undefined | null): Promise<boolean>;
}

export interface MashroomMessagingWebSocketHandler {
    startListeners(): void;
    stopListeners(): void;
}

export interface MashroomExternalMessagingProviderRegistry {
    readonly providers: Readonly<Array<MashroomMessagingExternalProvider>>;
    findProvider(pluginName: string): MashroomMessagingExternalProvider | undefined | null;
    register(pluginName: string, provider: MashroomMessagingExternalProvider): void;
    unregister(pluginName: string): void;
}
