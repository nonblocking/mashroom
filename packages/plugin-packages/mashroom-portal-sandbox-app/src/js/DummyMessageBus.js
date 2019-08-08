// @flow

import type { MashroomPortalMessageBusInterceptor, MashroomPortalMessageBusSubscriberCallback } from '@mashroom/mashroom-portal/type-definitions';
import type { DummyMessageBus as DummyMessageBusType } from '../../type-definitions';

type Subscription = {
    callback: MashroomPortalMessageBusSubscriberCallback,
    once: boolean
}

type SubscriptionMap = {
    [topic: string]: Array<Subscription>
}

export default class DummyMessageBus implements DummyMessageBusType {

    _subscriptionMap: SubscriptionMap;
    _onMessageSentCallback: ?(topic: string, data: any) => void;
    _onTopicsChangedCallback: ?(topics: Array<string>) => void;

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
        this._subscribe(topic, callback, false);
    }

    subscribeOnce(topic: string, callback: MashroomPortalMessageBusSubscriberCallback) {
        this._subscribe(topic, callback, true);
    }

    unsubscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback) {
        this._unsubscribe(topic, callback);
    }

    publish(topic: string, data: any) {
        this._publish(topic, data);
    }

    registerMessageInterceptor(interceptor: MashroomPortalMessageBusInterceptor) {
        throw new Error('Not implemented');
    }

    unregisterMessageInterceptor(interceptor: MashroomPortalMessageBusInterceptor) {
        throw new Error('Not implemented');
    }

    getAppInstance(appId: string) {
        const master = this;

        return {
            subscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback) {
                master._subscribe(topic, callback, false);
            },
            subscribeOnce(topic: string, callback: MashroomPortalMessageBusSubscriberCallback) {
                master._subscribe(topic, callback, true);
            },
            unsubscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback) {
                master.unsubscribe(topic, callback);
            },
            publish(topic: string, data: any) {
                master._publish(topic, data);
                if (master._onMessageSentCallback) {
                    master._onMessageSentCallback(topic, data);
                }
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
    }

    _unsubscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback) {
        if (this._subscriptionMap[topic]) {
            this._subscriptionMap[topic] = this._subscriptionMap[topic].filter((subscription) => subscription.callback !== callback);
        }
    }

    _publish(topic: string, data: any) {
        console.info(`Published to topic ${topic}: `, data);

        const subscriptions = this._subscriptionMap[topic];
        console.debug(`# of subscriptions for topic ${topic}: ${subscriptions ? subscriptions.length : 0}`);

        if (subscriptions) {
            subscriptions.forEach((subscription) => {
                setTimeout(() =>  subscription.callback(data), 0);
                if (subscription.once) {
                    this._unsubscribe(topic, subscription.callback);
                }
            });
        }
    }

}

