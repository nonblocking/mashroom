
// @ts-ignore
import {topicMatcher} from '@mashroom/mashroom-utils/lib/messaging_utils';
import {
    WINDOW_VAR_REMOTE_MESSAGING_CONNECT_PATH,
    WINDOW_VAR_REMOTE_MESSAGING_PRIVATE_USER_TOPIC,
    SESSION_STORAGE_WS_CLIENT_ID,
} from '../../../backend/constants';
import RemoteMessagingClient, {webSocketSupport} from './RemoteMessagingClient';

import type {
    MashroomPortalMasterMessageBus,
    MashroomPortalMessageBusInterceptor,
    MashroomPortalMessageBusSubscriberCallback
} from '../../../../type-definitions';

const REMOTE_MESSAGING_TOPIC_PREFIX = 'remote:';
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

    private subscriptionMap: SubscriptionMap;
    private interceptors: Array<Interceptor>;
    private remoteMessageClient: RemoteMessagingClient | undefined | null;

    constructor() {
        this.subscriptionMap = {};
        this.interceptors = [];

        if (webSocketSupport && REMOTE_MESSAGING_CONNECT_PATH) {
            const socketProtocol = (global.location.protocol === 'https:' ? 'wss:' : 'ws:');
            const host = global.document.location.hostname;
            const port = global.document.location.port ? `:${global.document.location.port}` : '';
            const clientId = global.sessionStorage.getItem(SESSION_STORAGE_WS_CLIENT_ID);
            const connectUrl = `${socketProtocol}//${host}${port}${REMOTE_MESSAGING_CONNECT_PATH}${clientId ? `?clientId=${clientId}` : ''}`;
            console.info('Enable remote messaging. WebSocket connect url: ', connectUrl);
            this.remoteMessageClient = new RemoteMessagingClient(connectUrl);
            this.remoteMessageClient.onMessage(this.handleRemoteMessage.bind(this));
        } else {
            console.info('Remote messaging not supported');
        }
    }

    subscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback): Promise<void> {
        return this.internalSubscribe(topic, callback, false);
    }

    subscribeOnce(topic: string, callback: MashroomPortalMessageBusSubscriberCallback): Promise<void> {
        return this.internalSubscribe(topic, callback, true);
    }

    unsubscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback): Promise<void> {
        return this.internalUnsubscribe(topic, callback);
    }

    publish(topic: string, data: any): Promise<void> {
        return this.internalPublish(topic, data);
    }

    getRemoteUserPrivateTopic(username?: string) {
        const privateTopicAuthenticatedUser = REMOTE_MESSAGING_PRIVATE_USER_TOPIC;
        if (!this.remoteMessageClient || !privateTopicAuthenticatedUser) {
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
        this.internalRegisterMessageInterceptor(interceptor);
    }

    unregisterMessageInterceptor(interceptor: MashroomPortalMessageBusInterceptor) {
        this.internalUnregisterMessageInterceptor(interceptor);
    }

    getAppInstance(appId: string) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const master = this;

        return {
            subscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback) {
                return master.internalSubscribe(topic, callback, false, appId);
            },
            subscribeOnce(topic: string, callback: MashroomPortalMessageBusSubscriberCallback) {
                return master.internalSubscribe(topic, callback, true, appId);
            },
            unsubscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback) {
                return master.unsubscribe(topic, callback);
            },
            publish(topic: string, data: any) {
                return master.internalPublish(topic, data, appId);
            },
            getRemoteUserPrivateTopic(username?: string) {
                return master.getRemoteUserPrivateTopic(username);
            },
            getRemotePrefix() {
                return master.getRemotePrefix();
            },
            registerMessageInterceptor(interceptor: MashroomPortalMessageBusInterceptor) {
                return master.internalRegisterMessageInterceptor(interceptor, appId);
            },
            unregisterMessageInterceptor(interceptor: MashroomPortalMessageBusInterceptor) {
                return master.internalUnregisterMessageInterceptor(interceptor);
            },
            getAppInstance() {
                throw new Error('Not available');
            }
        };
    }

    unsubscribeEverythingFromApp(appId: string) {
        console.info('Unregistering all MessageBus handlers from app:', appId);

        for (const topic in this.subscriptionMap) {
            if (this.subscriptionMap.hasOwnProperty(topic)) {
                this.subscriptionMap[topic].forEach((subscription) => {
                    if (subscription.appId === appId) {
                        this.internalUnsubscribe(topic, subscription.callback).then(
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

        this.interceptors.forEach((wrapper) => {
            if (wrapper.appId === appId) {
                this.internalUnregisterMessageInterceptor(wrapper.interceptor);
            }
        });
    }

    private internalSubscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback, once: boolean, appId?: string): Promise<void> {
        if (!this.subscriptionMap[topic]) {
            this.subscriptionMap[topic] = [];
        }

        if (!this.subscriptionMap[topic].find((subscription) => subscription.callback === callback)) {
            this.subscriptionMap[topic].push({
                callback,
                once,
                appId,
            });
        }

        if (topic.indexOf(REMOTE_MESSAGING_TOPIC_PREFIX) === 0) {
            if (this.remoteMessageClient) {
                return this.remoteMessageClient.subscribe(topic.substr(REMOTE_MESSAGING_TOPIC_PREFIX.length));
            } else {
                return Promise.reject('Remote messaging is not enabled');
            }
        }

        return Promise.resolve();
    }

    private internalUnsubscribe(topic: string, callback: MashroomPortalMessageBusSubscriberCallback): Promise<void> {
        if (this.subscriptionMap[topic]) {
            this.subscriptionMap[topic] = this.subscriptionMap[topic].filter((subscription) => subscription.callback !== callback);
        }

        if (topic.indexOf(REMOTE_MESSAGING_TOPIC_PREFIX) === 0) {
            if (this.remoteMessageClient) {
                return this.remoteMessageClient.unsubscribe(topic.substr(REMOTE_MESSAGING_TOPIC_PREFIX.length));
            } else {
                return Promise.reject('Remote messaging is not enabled');
            }
        }

        return Promise.resolve();
    }

    private internalPublish(topic: string, data: any, appId?: string): Promise<void> {
        console.info(`Published to topic ${topic} by app ${appId || '<unknown>'}: `, data);

        if (topic.indexOf(REMOTE_MESSAGING_TOPIC_PREFIX) === 0) {
            if (this.remoteMessageClient) {
                return this.remoteMessageClient.publish(topic.substr(REMOTE_MESSAGING_TOPIC_PREFIX.length), data);
            } else {
                return Promise.reject('Remote messaging is not enabled');
            }
        }

        const subscriptions = this.subscriptionMap[topic];
        console.debug(`Subscriptions for topic ${topic}: ${subscriptions ? subscriptions.length : 0}`);

        if (subscriptions) {
            subscriptions.forEach((subscription) => {
                setTimeout(() => this.deliverMessage(topic, data, appId, subscription), 0);
                if (subscription.once) {
                    this.internalUnsubscribe(topic, subscription.callback);
                }
            });
        }

        return Promise.resolve();
    }

    private deliverMessage(topic: string, data: any, senderAppId: string | undefined | null, subscription: Subscription) {
        let resultData = data;
        this.interceptors.forEach((wrapper) => {
            resultData = wrapper.interceptor(resultData, topic, senderAppId, subscription.appId);
        });

        if (resultData) {
            subscription.callback(resultData, topic, senderAppId);
        }
    }

    private handleRemoteMessage(data: any, remoteTopic: string) {
        const topic = REMOTE_MESSAGING_TOPIC_PREFIX + remoteTopic;
        console.info('Received remote message for topic: ', topic);

        let subscriptions: Array<Subscription> = [];
        Object.keys(this.subscriptionMap)
            .filter((t) => topicMatcher(t, topic))
            .forEach((t) => {
                subscriptions = subscriptions.concat(this.subscriptionMap[t]);
            });
        console.debug(`Subscriptions for remote topic ${topic}: ${subscriptions ? subscriptions.length : 0}`);

        if (subscriptions) {
            subscriptions.forEach((subscription) => {
                setTimeout(() => this.deliverMessage(topic, data, 'server', subscription), 0);
                if (subscription.once) {
                    this.internalUnsubscribe(topic, subscription.callback);
                }
            });
        }
    }

    private internalRegisterMessageInterceptor(interceptor: MashroomPortalMessageBusInterceptor, appId?: string) {
        this.interceptors.push({
            interceptor,
            appId,
        });
    }

    private internalUnregisterMessageInterceptor(interceptor: MashroomPortalMessageBusInterceptor) {
        const wrapper = this.interceptors.find((wrapper) => wrapper.interceptor === interceptor);
        if (wrapper) {
            this.interceptors.splice(this.interceptors.indexOf(wrapper), 1);
        }
    }
}
