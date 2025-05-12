import React, {useCallback, useEffect} from 'react';
import {FormattedMessage} from 'react-intl';

import {useDispatch, useSelector} from 'react-redux';
import {addReceivedMessage as addReceivedMessageAction, setGlobalNotificationsSubscription as setGlobalNotificationsSubscriptionAction, setPrivateUserTopicsSubscription as setPrivateUserTopicsSubscriptionAction} from '../store/actions';
import type {MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions';
import type {Subscription, ReceivedMessage, State} from '../types';

type Props = {
    messageBus: MashroomPortalMessageBus,
}

export default ({messageBus}: Props) => {
    const {privateUserTopicsSubscription, globalNotificationsSubscription} = useSelector((state: State) => state);
    const dispatch = useDispatch();
    const setPrivateUserTopicsSubscription = (subscription: Subscription) => dispatch(setPrivateUserTopicsSubscriptionAction(subscription));
    const setGlobalNotificationsSubscription = (subscription: Subscription) => dispatch(setGlobalNotificationsSubscriptionAction(subscription));
    const addReceivedMessage = (message: ReceivedMessage) => dispatch(addReceivedMessageAction(message));

    const onReceiveMessage = useCallback((message: any, topic: string): void => {
        const receivedMessage: ReceivedMessage = {
            topic,
            message,
            timestamp: Date.now(),
        };
        addReceivedMessage(receivedMessage);
    }, []);

    useEffect(() => {
        const userPrivateTopic = messageBus.getRemoteUserPrivateTopic();

        const globalNotificationsTopic = `${messageBus.getRemotePrefix()}global-notifications`;
        messageBus.subscribe(globalNotificationsTopic, onReceiveMessage).then(
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
        messageBus.subscribe(allUserPrivateTopics, onReceiveMessage).then(
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
    }, []);

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
};
