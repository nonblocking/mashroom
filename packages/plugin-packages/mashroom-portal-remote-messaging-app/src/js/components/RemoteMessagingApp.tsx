
import React from 'react';
import {IntlProvider} from 'react-intl';
import {Provider as ReduxProvider} from 'react-redux';
import store from '../store/store';
import messages from '../messages/messages';
import MessageBusSendForm from './MessageBusSendForm';
import SubscriptionPanel from './SubscriptionPanel';
import MessageBusHistory from './MessageBusHistory';

import type {MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions';

type Props = {
    lang: string,
    messageBus: MashroomPortalMessageBus,
}

export default ({lang, messageBus}: Props) => {
    let existingLang = lang;
    if (!messages[existingLang]) {
        existingLang = 'en';
    }

    return (
        <ReduxProvider store={store}>
            <IntlProvider messages={messages[existingLang]} locale={existingLang}>
                <div className='mashroom-remote-messaging-app'>
                    <MessageBusSendForm messageBus={messageBus} />
                    <SubscriptionPanel messageBus={messageBus} />
                    <MessageBusHistory />
                </div>
            </IntlProvider>
        </ReduxProvider>
    );
};
