
import getClientServices from './client_services';

import type {MashroomPortalMasterMessageBus} from '@mashroom/mashroom-portal/type-definitions';
import type {MessageBusPortalAppUnderTest} from './types';
import {
    MashroomPortalMessageBusInterceptor,
    MashroomPortalMessageBusSubscriberCallback
} from '@mashroom/mashroom-portal/type-definitions';

export default (): MessageBusPortalAppUnderTest => {

    const masterMessageBus = getClientServices().messageBus as MashroomPortalMasterMessageBus;
    const messageBus = masterMessageBus.getAppInstance('portalAppUnderTest');
    let onMessageSentCallback: ((topic: string, data: any) => void) | null;
    let onTopicsChangedCallback: ((topics: Array<string>) => void) | null;
    const topics: Array<string> = [];

    return {
        async subscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback) {
            await messageBus.subscribe(topic, callback);
            if (topics.indexOf(topic) === -1) {
                topics.push(topic);
            }
            if (onTopicsChangedCallback) {
                onTopicsChangedCallback(topics);
            }
        },
        async subscribeOnce(topic: string, callback: MashroomPortalMessageBusSubscriberCallback) {
            await messageBus.subscribeOnce(topic, callback);
            if (topics.indexOf(topic) === -1) {
                topics.push(topic);
            }
            if (onTopicsChangedCallback) {
                onTopicsChangedCallback(topics);
            }
        },
        async unsubscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback) {
            return messageBus.unsubscribe(topic, callback);
        },
        async publish(topic: string, data: any) {
            if (onMessageSentCallback) {
                onMessageSentCallback(topic, data);
            }
            return messageBus.publish(topic, data);
        },
        getRemoteUserPrivateTopic(username?: string) {
            return messageBus.getRemoteUserPrivateTopic(username);
        },
        getRemotePrefix() {
            return messageBus.getRemotePrefix();
        },
        registerMessageInterceptor(interceptor: MashroomPortalMessageBusInterceptor) {
            messageBus.registerMessageInterceptor(interceptor);
        },
        unregisterMessageInterceptor(interceptor: MashroomPortalMessageBusInterceptor) {
            messageBus.unregisterMessageInterceptor(interceptor);
        },
        onMessageSent(callback: (topic: string, data: any) => void) {
            onMessageSentCallback = callback;
        },
        onTopicsChanged(callback: (topics: Array<string>) => void) {
            onTopicsChangedCallback = callback;
        }
    };
}
