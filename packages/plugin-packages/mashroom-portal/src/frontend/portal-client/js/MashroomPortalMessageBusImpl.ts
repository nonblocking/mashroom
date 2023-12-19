import {
    WINDOW_VAR_REMOTE_MESSAGING_CONNECT_PATH,
    WINDOW_VAR_REMOTE_MESSAGING_PRIVATE_USER_TOPIC,
    SESSION_STORAGE_WS_CLIENT_ID,
} from '../../../backend/constants';
import RemoteMessagingClient, {webSocketSupport} from './RemoteMessagingClient';

import type {
    MashroomPortalMasterMessageBus,
    MashroomPortalMessageBusInterceptor,
    MashroomPortalMessageBusSubscriberCallback,
    MashroomPortalMessageBus
} from '../../../../type-definitions';

const REMOTE_MESSAGING_TOPIC_PREFIX = 'remote:';
const REMOTE_MESSAGING_WILDCARDS_MULTI = ['#'];
const REMOTE_MESSAGING_WILDCARDS_SINGLE = ['+', '*'];
const REMOTE_MESSAGING_CONNECT_PATH: string | undefined = (global as any)[WINDOW_VAR_REMOTE_MESSAGING_CONNECT_PATH];
const REMOTE_MESSAGING_PRIVATE_USER_TOPIC: string | undefined = (global as any)[WINDOW_VAR_REMOTE_MESSAGING_PRIVATE_USER_TOPIC];

type Subscription = {
    callback: MashroomPortalMessageBusSubscriberCallback;
    once: boolean;
    appId: string | undefined | null;
}

type SubscriptionMap = {
    [topic: string]: Array<Subscription>;
}

type Interceptor = {
    interceptor: MashroomPortalMessageBusInterceptor;
    appId: string | undefined | null;
}

export default class MashroomPortalMessageBusImpl implements MashroomPortalMasterMessageBus {

    private _subscriptionMap: SubscriptionMap;
    private _interceptors: Array<Interceptor>;
    private _remoteMessageClient: RemoteMessagingClient | undefined | null;

    constructor() {
        this._subscriptionMap = {};
        this._interceptors = [];

        if (webSocketSupport && REMOTE_MESSAGING_CONNECT_PATH) {
            const socketProtocol = (global.location.protocol === 'https:' ? 'wss:' : 'ws:');
            const host = global.document.location.hostname;
            const port = global.document.location.port ? `:${global.document.location.port}` : '';
            const clientId = global.sessionStorage.getItem(SESSION_STORAGE_WS_CLIENT_ID);
            const connectUrl = `${socketProtocol}//${host}${port}${REMOTE_MESSAGING_CONNECT_PATH}${clientId ? `?clientId=${clientId}` : ''}`;
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

    getRemoteUserPrivateTopic(username?: string): string | null | undefined {
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

    getRemotePrefix(): string {
        return REMOTE_MESSAGING_TOPIC_PREFIX;
    }

    registerMessageInterceptor(interceptor: MashroomPortalMessageBusInterceptor): void {
        this._registerMessageInterceptor(interceptor);
    }

    unregisterMessageInterceptor(interceptor: MashroomPortalMessageBusInterceptor): void {
        this._unregisterMessageInterceptor(interceptor);
    }

    getAppInstance(appId: string): MashroomPortalMessageBus {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
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
                return master._registerMessageInterceptor(interceptor, appId);
            },
            unregisterMessageInterceptor(interceptor: MashroomPortalMessageBusInterceptor) {
                return master._unregisterMessageInterceptor(interceptor);
            }
        };
    }

    unsubscribeEverythingFromApp(appId: string): void {
        console.info('Unregistering all MessageBus handlers from app:', appId);

        for (const topic in this._subscriptionMap) {
            if (this._subscriptionMap.hasOwnProperty(topic)) {
                this._subscriptionMap[topic].forEach((subscription) => {
                    if (subscription.appId === appId) {
                        this._unsubscribe(topic, subscription.callback).then(
                            () => {
                                // Nothing to do
                            },
                            (error) => {
                                console.error(`Unsubscribing app ${appId} from topic ${topic} failed`, error);
                            }
                        );
                    }
                });
            }
        }

        this._interceptors.forEach((wrapper) => {
            if (wrapper.appId === appId) {
                this._unregisterMessageInterceptor(wrapper.interceptor);
            }
        });
    }

    private _subscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback, once: boolean, appId?: string): Promise<void> {
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

    private _unsubscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback): Promise<void> {
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

    private _publish(topic: string, data: any, appId?: string): Promise<void> {
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

    private _deliverMessage(topic: string, data: any, senderAppId: string | undefined | null, subscription: Subscription) {
        let resultData = data;
        let canceled = false;
        const cancelMessage = () => canceled = true;

        this._interceptors.forEach((wrapper) => {
            const returnValue = wrapper.interceptor(resultData, topic, senderAppId, subscription.appId, cancelMessage);
            if (typeof returnValue !== 'undefined') {
                console.debug(`Message bus interceptor changed data for topic '${topic}' from`, resultData, 'to:', returnValue);
                resultData = returnValue;
            }
        });

        if (!canceled) {
            subscription.callback(resultData, topic, senderAppId);
        } else {
            console.debug(`Message bus interceptor cancelled event for topic '${topic}' with data:`, resultData);
        }
    }

    private _handleRemoteMessage(data: any, remoteTopic: string) {
        const topic = REMOTE_MESSAGING_TOPIC_PREFIX + remoteTopic;
        console.info('Received remote message for topic: ', topic);

        let subscriptions: Array<Subscription> = [];
        Object.keys(this._subscriptionMap)
            .filter((pattern) => {
                let regex = `^${pattern}$`;
                REMOTE_MESSAGING_WILDCARDS_SINGLE.forEach((w) => regex = regex.replace(w, '[^/]+'));
                REMOTE_MESSAGING_WILDCARDS_MULTI.forEach((w) => regex = regex.replace(w, '.*'));
                return !!topic.match(new RegExp(regex));
            })
            .forEach((pattern) => {
                subscriptions = subscriptions.concat(this._subscriptionMap[pattern]);
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

    private _registerMessageInterceptor(interceptor: MashroomPortalMessageBusInterceptor, appId?: string) {
        this._interceptors.push({
            interceptor,
            appId,
        });
    }

    private _unregisterMessageInterceptor(interceptor: MashroomPortalMessageBusInterceptor) {
        const wrapper = this._interceptors.find((wrapper) => wrapper.interceptor === interceptor);
        if (wrapper) {
            this._interceptors.splice(this._interceptors.indexOf(wrapper), 1);
        }
    }
}
