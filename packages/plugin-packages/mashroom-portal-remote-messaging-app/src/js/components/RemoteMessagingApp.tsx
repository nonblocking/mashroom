
import React from 'react';
import {Provider as ReduxProvider} from 'react-redux';
import store from '../store/store';
import MessagesProvider from '../messages/MessagesProvider';
import MessageBusSendForm from './MessageBusSendForm';
import SubscriptionPanel from './SubscriptionPanel';
import MessageBusHistory from './MessageBusHistory';

import type {MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions';


type Props = {
    lang: string,
    messageBus: MashroomPortalMessageBus,
}

export default ({lang, messageBus}: Props) => {
    return (
        <ReduxProvider store={store}>
            <MessagesProvider lang={lang}>
                <div className='mashroom-remote-messaging-app'>
                    <MessageBusSendForm messageBus={messageBus} />
                    <SubscriptionPanel messageBus={messageBus} />
                    <MessageBusHistory />
                </div>
            </MessagesProvider>
        </ReduxProvider>
    );
};
