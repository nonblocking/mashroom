
import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';

import type {ReactNode} from 'react';
import type {MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions';
import type {Subscription, ReceivedMessage} from '../types';

type Props = {
    privateUserTopicsSubscription: Subscription,
    globalNotificationsSubscription: Subscription,
    messageBus: MashroomPortalMessageBus,
    setPrivateUserTopicsSubscription: (subscription: Subscription) => void,
    setGlobalNotificationsSubscription: (subscription: Subscription) => void,
    addReceivedMessage: (message: ReceivedMessage) => void,
}

export default class SubscriptionPanel extends PureComponent<Props> {

    componentDidMount(): void {
        const { messageBus, setPrivateUserTopicsSubscription, setGlobalNotificationsSubscription } = this.props;
        const userPrivateTopic = messageBus.getRemoteUserPrivateTopic();

        const globalNotificationsTopic = `${messageBus.getRemotePrefix()}global-notifications`;
        messageBus.subscribe(globalNotificationsTopic, this.onReceiveMessage.bind(this)).then(
            () => {
                setGlobalNotificationsSubscription({
                    topic: globalNotificationsTopic,
                    status: 'Success',
                });
            },
            (error) => {
                setPrivateUserTopicsSubscription({
                    topic: globalNotificationsTopic,
                    status: 'Error',
                    errorMessage: JSON.stringify(error),
                });
            }
        );

        if (!userPrivateTopic) {
            console.error('No messaging or websocket support, cannot subscribe to remote topic');
            setPrivateUserTopicsSubscription({
                topic: '',
                status: 'Error',
            });
            return;
        }

        const allUserPrivateTopics = `${messageBus.getRemotePrefix()}${userPrivateTopic}/#`;
        messageBus.subscribe(allUserPrivateTopics, this.onReceiveMessage.bind(this)).then(
            () => {
                setPrivateUserTopicsSubscription({
                    topic: allUserPrivateTopics,
                    status: 'Success',
                });
            },
            (error) => {
                setPrivateUserTopicsSubscription({
                    topic: allUserPrivateTopics,
                    status: 'Error',
                    errorMessage: JSON.stringify(error),
                });
            }
        );
    }

    onReceiveMessage(message: any, topic: string): void {
        const { addReceivedMessage} = this.props;
        const receivedMessage: ReceivedMessage = {
            topic,
            message,
            timestamp: Date.now(),
        };
        addReceivedMessage(receivedMessage);
    }

    render(): ReactNode {
        const { privateUserTopicsSubscription, globalNotificationsSubscription } = this.props;

        return (
            <div className='mashroom-remote-messaging-app-subscription-status'>
                <div className='mashroom-remote-messaging-app-output-row'>
                    <div>
                        <FormattedMessage id='subscribeTopics' />
                    </div>
                    <div>
                        <ul>
                            <li>
                                <div className='remote-topic'>
                                    {privateUserTopicsSubscription.topic}
                                </div>
                                <div className={`${privateUserTopicsSubscription.status === 'Error' ? 'mashroom-portal-ui-error-message' : ''}`}>
                                    ({privateUserTopicsSubscription.status}
                                    &nbsp;
                                    {privateUserTopicsSubscription.errorMessage ? `(${privateUserTopicsSubscription.errorMessage})` : ''})
                                </div>
                            </li>
                            <li>
                                <div className='remote-topic'>
                                    {globalNotificationsSubscription.topic}
                                </div>
                                <div className={`${globalNotificationsSubscription.status === 'Error' ? 'mashroom-portal-ui-error-message' : ''}`}>
                                    ({globalNotificationsSubscription.status}
                                    &nbsp;
                                    {globalNotificationsSubscription.errorMessage ? `(${globalNotificationsSubscription.errorMessage})` : ''})
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

}
