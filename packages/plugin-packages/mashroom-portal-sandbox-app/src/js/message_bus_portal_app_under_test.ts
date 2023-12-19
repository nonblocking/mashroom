
import getClientServices from './client-services';
import type {
    MashroomPortalMessageBusInterceptor,
    MashroomPortalMessageBusSubscriberCallback,
    MashroomPortalMasterMessageBus
} from '@mashroom/mashroom-portal/type-definitions';

import type {MessageBusPortalAppUnderTest} from './types';

export default (): MessageBusPortalAppUnderTest => {

    const masterMessageBus = getClientServices().messageBus as MashroomPortalMasterMessageBus;
    const messageBus = masterMessageBus.getAppInstance('portalAppUnderTest');
    let onMessageSentCallback: ((topic: string, data: any) => void) | null;
    let onTopicsChangedCallback: ((topics: Array<string>) => void) | null;
    const topics: Array<string> = [];

    return {
        subscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback) {
            return messageBus.subscribe(topic, callback).then(() => {
                if (topics.indexOf(topic) === -1) {
                    topics.push(topic);
                }
                if (onTopicsChangedCallback) {
                    onTopicsChangedCallback(topics);
                }
            });
        },
        subscribeOnce(topic: string, callback: MashroomPortalMessageBusSubscriberCallback) {
            return messageBus.subscribeOnce(topic, callback).then(() => {
                if (topics.indexOf(topic) === -1) {
                    topics.push(topic);
                }
                if (onTopicsChangedCallback) {
                    onTopicsChangedCallback(topics);
                }
            });
        },
        unsubscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback) {
            return messageBus.unsubscribe(topic, callback);
        },
        publish(topic: string, data: any) {
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
};
