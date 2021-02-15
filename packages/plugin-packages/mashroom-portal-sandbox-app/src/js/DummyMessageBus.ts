
import type { MashroomPortalMessageBusInterceptor, MashroomPortalMessageBusSubscriberCallback } from '@mashroom/mashroom-portal/type-definitions';
import type { DummyMessageBus as DummyMessageBusType } from './types';

type Subscription = {
    callback: MashroomPortalMessageBusSubscriberCallback,
    once: boolean
}

type SubscriptionMap = {
    [topic: string]: Array<Subscription>
}

export default class DummyMessageBus implements DummyMessageBusType {

    _subscriptionMap: SubscriptionMap;
    _onMessageSentCallback: ((topic: string, data: any) => void) | null;
    _onTopicsChangedCallback: ((topics: Array<string>) => void) | null;

    constructor() {
        this._subscriptionMap = {};
        this._onMessageSentCallback = null;
        this._onTopicsChangedCallback = null;
    }

    onMessageSent(callback: (topic: string, data: any) => void) {
        this._onMessageSentCallback = callback;
    }

    onTopicsChanged(callback: (topics: Array<string>) => void) {
        this._onTopicsChangedCallback = callback;
    }

    reset() {
        this._subscriptionMap = {};
    }

    subscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback) {
        return this._subscribe(topic, callback, false);
    }

    subscribeOnce(topic: string, callback: MashroomPortalMessageBusSubscriberCallback) {
        return this._subscribe(topic, callback, true);
    }

    unsubscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback) {
        return this._unsubscribe(topic, callback);
    }

    publish(topic: string, data: any) {
        return this._publish(topic, data);
    }

    getRemoteUserPrivateTopic() {
        return 'user/mock';
    }

    getRemotePrefix() {
        return 'remote:';
    }

    registerMessageInterceptor(interceptor: MashroomPortalMessageBusInterceptor) {
        throw new Error('Not implemented');
    }

    unregisterMessageInterceptor(interceptor: MashroomPortalMessageBusInterceptor) {
        throw new Error('Not implemented');
    }

    getAppInstance(appId: string) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const master = this;

        return {
            subscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback) {
                return master._subscribe(topic, callback, false);
            },
            subscribeOnce(topic: string, callback: MashroomPortalMessageBusSubscriberCallback) {
                return master._subscribe(topic, callback, true);
            },
            unsubscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback) {
                return master.unsubscribe(topic, callback);
            },
            publish(topic: string, data: any) {
                if (master._onMessageSentCallback) {
                    master._onMessageSentCallback(topic, data);
                }
                return master._publish(topic, data);
            },
            getRemoteUserPrivateTopic() {
                return master.getRemoteUserPrivateTopic();
            },
            getRemotePrefix() {
                return master.getRemotePrefix();
            },
            registerMessageInterceptor(interceptor: MashroomPortalMessageBusInterceptor) {
                master.registerMessageInterceptor(interceptor);
            },
            unregisterMessageInterceptor(interceptor: MashroomPortalMessageBusInterceptor) {
                master.unregisterMessageInterceptor(interceptor);
            },
            getAppInstance() {
                throw new Error('Not available');
            }
        };
    }

    unsubscribeEverythingFromApp() {
        // Not implemented
    }

    _subscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback, once: boolean) {
        if (!this._subscriptionMap[topic]) {
            this._subscriptionMap[topic] = [];
            if (this._onTopicsChangedCallback) {
                this._onTopicsChangedCallback(Object.keys(this._subscriptionMap));
            }
        }

        if (!this._subscriptionMap[topic].find((subscription) => subscription.callback === callback)) {
            this._subscriptionMap[topic].push({
                callback,
                once,
            });
        }

        return Promise.resolve();
    }

    _unsubscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback) {
        if (this._subscriptionMap[topic]) {
            this._subscriptionMap[topic] = this._subscriptionMap[topic].filter((subscription) => subscription.callback !== callback);
        }

        return Promise.resolve();
    }

    _publish(topic: string, data: any) {
        console.info(`Published to topic ${topic}: `, data);

        const subscriptions = this._subscriptionMap[topic];
        console.debug(`# of subscriptions for topic ${topic}: ${subscriptions ? subscriptions.length : 0}`);

        if (subscriptions) {
            subscriptions.forEach((subscription) => {
                setTimeout(() =>  subscription.callback(data, topic, null), 0);
                if (subscription.once) {
                    this._unsubscribe(topic, subscription.callback);
                }
            });
        }

        return Promise.resolve();
    }

}

