// @flow

import {topicMatcher} from '@mashroom/mashroom-utils/lib/messaging_utils';
import {WINDOW_VAR_REMOTE_MESSAGING_CONNECT_PATH, WINDOW_VAR_REMOTE_MESSAGING_PRIVATE_USER_TOPIC} from '../../../backend/constants';
import RemoteMessagingClient, {webSocketSupport} from './RemoteMessagingClient';

import type {
    MashroomPortalMessageBus,
    MashroomPortalMessageBusInterceptor,
    MashroomPortalMessageBusSubscriberCallback
} from '../../../../type-definitions';

const REMOTE_MESSAGING_TOPIC_PREFIX = 'remote:';
const REMOTE_MESSAGING_CONNECT_PATH: ?string = global[WINDOW_VAR_REMOTE_MESSAGING_CONNECT_PATH];
const REMOTE_MESSAGING_PRIVATE_USER_TOPIC: ?string = global[WINDOW_VAR_REMOTE_MESSAGING_PRIVATE_USER_TOPIC];

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
    _remoteMessageClient: ?RemoteMessagingClient;

    constructor() {
        this._subscriptionMap = {};
        this._interceptors = [];

        if (webSocketSupport && REMOTE_MESSAGING_CONNECT_PATH) {
            const socketProtocol = (global.location.protocol === 'https:' ? 'wss:' : 'ws:');
            const host = global.document.location.hostname;
            const port = global.document.location.port ? ':' + global.document.location.port : '';
            const connectUrl = `${socketProtocol}//${host}${port}${REMOTE_MESSAGING_CONNECT_PATH}`;
            console.info('Enable remote messaging. WebSocket connect url: ', connectUrl);
            this._remoteMessageClient = new RemoteMessagingClient(connectUrl);
            this._remoteMessageClient.onMessage(this._handleRemoteMessage.bind(this));
        } else {
            console.info('Remote messaging not supported');
        }
    }

    subscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback): Promise<void> {
        return this._subscribe(topic, callback, false);
    }

    subscribeOnce(topic: string, callback: MashroomPortalMessageBusSubscriberCallback): Promise<void> {
        return this._subscribe(topic, callback, true);
    }

    unsubscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback): Promise<void> {
        return this._unsubscribe(topic, callback);
    }

    publish(topic: string, data: any): Promise<void> {
        return this._publish(topic, data);
    }

    getRemoteUserPrivateTopic(username?: string) {
        const privateTopicAuthenticatedUser = REMOTE_MESSAGING_PRIVATE_USER_TOPIC;
        if (!this._remoteMessageClient || !privateTopicAuthenticatedUser) {
            return null;
        }
        if (!username) {
            return privateTopicAuthenticatedUser;
        }

        const topicLevels = privateTopicAuthenticatedUser.split('/');
        topicLevels.pop();
        return `${topicLevels.join('/')}/${username}`;
    }

    getRemotePrefix() {
        return REMOTE_MESSAGING_TOPIC_PREFIX;
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
                return master._subscribe(topic, callback, false, appId);
            },
            subscribeOnce(topic: string, callback: MashroomPortalMessageBusSubscriberCallback) {
                return master._subscribe(topic, callback, true, appId);
            },
            unsubscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback) {
                return master.unsubscribe(topic, callback);
            },
            publish(topic: string, data: any) {
                return master._publish(topic, data, appId);
            },
            getRemoteUserPrivateTopic(username?: string) {
                return master.getRemoteUserPrivateTopic(username);
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

    _subscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback, once: boolean, appId?: string): Promise<void> {
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

        if (topic.indexOf(REMOTE_MESSAGING_TOPIC_PREFIX) === 0) {
            if (this._remoteMessageClient) {
                return this._remoteMessageClient.subscribe(topic.substr(REMOTE_MESSAGING_TOPIC_PREFIX.length));
            } else {
                return Promise.reject('Remote messaging is not enabled');
            }
        }

        return Promise.resolve();
    }

    _unsubscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback): Promise<void> {
        if (this._subscriptionMap[topic]) {
            this._subscriptionMap[topic] = this._subscriptionMap[topic].filter((subscription) => subscription.callback !== callback);
        }

        if (topic.indexOf(REMOTE_MESSAGING_TOPIC_PREFIX) === 0) {
            if (this._remoteMessageClient) {
                return this._remoteMessageClient.unsubscribe(topic.substr(REMOTE_MESSAGING_TOPIC_PREFIX.length));
            } else {
                return Promise.reject('Remote messaging is not enabled');
            }
        }

        return Promise.resolve();
    }

    _publish(topic: string, data: any, appId?: string): Promise<void> {
        console.info(`Published to topic ${topic} by app ${appId || '<unknown>'}: `, data);

        if (topic.indexOf(REMOTE_MESSAGING_TOPIC_PREFIX) === 0) {
            if (this._remoteMessageClient) {
                return this._remoteMessageClient.publish(topic.substr(REMOTE_MESSAGING_TOPIC_PREFIX.length), data);
            } else {
                return Promise.reject('Remote messaging is not enabled');
            }
        }

        const subscriptions = this._subscriptionMap[topic];
        console.debug(`Subscriptions for topic ${topic}: ${subscriptions ? subscriptions.length : 0}`);

        if (subscriptions) {
            subscriptions.forEach((subscription) => {
                setTimeout(() => this._deliverMessage(topic, data, appId, subscription), 0);
                if (subscription.once) {
                    this._unsubscribe(topic, subscription.callback);
                }
            });
        }

        return Promise.resolve();
    }

    _deliverMessage(topic: string, data: any, senderAppId: ?string, subscription: Subscription) {
        let resultData = data;
        this._interceptors.forEach((interceptor) => {
            resultData = interceptor(resultData, topic, senderAppId, subscription.appId);
        });

        if (resultData) {
            subscription.callback(resultData, topic, senderAppId);
        }
    }

    _handleRemoteMessage(data: any, remoteTopic: string) {
        const topic = REMOTE_MESSAGING_TOPIC_PREFIX + remoteTopic;
        console.info('Received remote message for topic: ', topic);

        let subscriptions = [];
        Object.keys(this._subscriptionMap)
            .filter((t) => topicMatcher(t, topic))
            .forEach((t) => {
                subscriptions = subscriptions.concat(this._subscriptionMap[t]);
            });
        console.debug(`Subscriptions for remote topic ${topic}: ${subscriptions ? subscriptions.length : 0}`);

        if (subscriptions) {
            subscriptions.forEach((subscription) => {
                setTimeout(() => this._deliverMessage(topic, data, 'server', subscription), 0);
                if (subscription.once) {
                    this._unsubscribe(topic, subscription.callback);
                }
            });
        }
    }
}
