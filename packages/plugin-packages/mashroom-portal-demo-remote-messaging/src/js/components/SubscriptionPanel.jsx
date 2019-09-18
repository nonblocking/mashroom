// @flow

import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';

import type {MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions';
import type {Subscription, ReceivedMessage} from '../../../type-definitions';

type Props = {
    subscription: Subscription,
    messageBus: MashroomPortalMessageBus,
    setSubscription: (subscription: Subscription) => void,
    addReceivedMessage: (message: ReceivedMessage) => void,
}

export default class SubscriptionPanel extends PureComponent<Props> {

    componentDidMount() {
        const { messageBus, setSubscription } = this.props;
        const userPrivateTopic = messageBus.getRemoteUserPrivateTopic();
        if (!userPrivateTopic) {
            console.error('No messaging or websocket support, cannot subscribe to remote topic');
            setSubscription({
                topic: '',
                status: 'Error',
            });
            return;
        }

        const topic = `${messageBus.getRemotePrefix()}${userPrivateTopic}/#`;
        messageBus.subscribe(topic, this.onReceiveMessage.bind(this)).then(
            () => {
                setSubscription({
                    topic,
                    status: 'Success',
                });
            },
            (error) => {
                setSubscription({
                    topic,
                    status: 'Error',
                    errorMessage: JSON.stringify(error),
                });
            }
        );
    }

    onReceiveMessage(message: any, topic: string) {
        const { addReceivedMessage} = this.props;
        const receivedMessage: ReceivedMessage = {
            topic,
            message,
            timestamp: Date.now(),
        };
        addReceivedMessage(receivedMessage);
    }

    render() {
        const { subscription: { topic, status, errorMessage } } = this.props;

        return (
            <div className='mashroom-demo-remote-messaging-app-subscription-status'>
                <div className='mashroom-demo-remote-messaging-app-output-row'>
                    <div>
                        <FormattedMessage id='subscribeTopic' />
                    </div>
                    <div className='remote-topic'>
                        {topic}
                    </div>
                </div>
                <div className='mashroom-demo-remote-messaging-app-output-row'>
                    <div>
                        <FormattedMessage id='subscriptionStatus' />
                    </div>
                    <div className={`${status === 'Error' ? 'mashroom-portal-ui-error-message' : ''}`}>
                        {status}
                        &nbsp;
                        {errorMessage ? `(${errorMessage})` : ''}
                    </div>
                </div>
            </div>
        );
    }

}
