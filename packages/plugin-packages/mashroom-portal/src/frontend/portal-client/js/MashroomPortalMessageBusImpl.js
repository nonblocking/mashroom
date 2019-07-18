// @flow

import type {
    MashroomPortalMessageBus,
    MashroomPortalMessageBusInterceptor,
    MashroomPortalMessageBusSubscriberCallback
} from '../../../../type-definitions';

type Subscription = {
    callback: MashroomPortalMessageBusSubscriberCallback,
    once: boolean,
    appId: ?string,
}

type SubscriptionMap = {
    [topic: string]: Array<Subscription>
}

export default class MashroomPortalMessageBusImpl implements MashroomPortalMessageBus {

    _subscriptionMap: SubscriptionMap;
    _interceptors: Array<MashroomPortalMessageBusInterceptor>;

    constructor() {
        this._subscriptionMap = {};
        this._interceptors = [];
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
        this._interceptors.push(interceptor);
    }

    unregisterMessageInterceptor(interceptor: MashroomPortalMessageBusInterceptor) {
        const index = this._interceptors.indexOf(interceptor);
        if (index !== -1) {
            this._interceptors.splice(index, 1);
        }
    }

    getAppInstance(appId: string) {
        const master = this;

        return {
            subscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback) {
                master._subscribe(topic, callback, false, appId);
            },
            subscribeOnce(topic: string, callback: MashroomPortalMessageBusSubscriberCallback) {
                master._subscribe(topic, callback, true, appId);
            },
            unsubscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback) {
                master.unsubscribe(topic, callback);
            },
            publish(topic: string, data: any) {
                master._publish(topic, data, appId);
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

    _subscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback, once: boolean, appId?: string) {
        if (!this._subscriptionMap[topic]) {
            this._subscriptionMap[topic] = [];
        }

        if (!this._subscriptionMap[topic].find((subscription) => subscription.callback === callback)) {
            this._subscriptionMap[topic].push({
                callback,
                once,
                appId,
            });
        }
    }

    _unsubscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback) {
        if (this._subscriptionMap[topic]) {
            this._subscriptionMap[topic] = this._subscriptionMap[topic].filter((subscription) => subscription.callback !== callback);
        }
    }

    _publish(topic: string, data: any, appId?: string) {
        console.info(`Published to topic ${topic} by app ${appId || '<unknown>'}: `, data);

        const subscriptions = this._subscriptionMap[topic];
        console.debug(`# of subscriptions for topic ${topic}: ${subscriptions ? subscriptions.length : 0}`);

        if (subscriptions) {
            subscriptions.forEach((subscription) => {
                setTimeout(() => this._sendMessage(topic, data, appId, subscription), 0);
                if (subscription.once) {
                    this._unsubscribe(topic, subscription.callback);
                }
            });
        }
    }

    _sendMessage(topic: string, data: any, senderAppId: ?string, subscription: Subscription) {
        let resultData = data;
        this._interceptors.forEach((interceptor) => {
            resultData = interceptor(topic, resultData, senderAppId, subscription.appId);
        });

        if (resultData) {
            subscription.callback(resultData, senderAppId);
        }
    }
}
