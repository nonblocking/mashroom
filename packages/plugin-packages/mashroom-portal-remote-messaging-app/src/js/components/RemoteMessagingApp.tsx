
import React from 'react';
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
        <MessagesProvider lang={lang}>
            <div className='mashroom-remote-messaging-app'>
                <MessageBusSendForm messageBus={messageBus} />
                <SubscriptionPanel messageBus={messageBus} />
                <MessageBusHistory />
            </div>
        </MessagesProvider>
    );
};
