// @flow

import React, {PureComponent} from 'react';
import {IntlProvider} from 'react-intl';
import {Provider as ReduxProvider} from 'react-redux';
import store from '../store/store';
import messages from '../messages/messages';
import MessageBusHistoryContainer from '../containers/MessageBusHistoryContainer';
import MessageBusSendFormContainer from '../containers/MessageBusSendFormContainer';
import SubscriptionPanelContainer from '../containers/SubscriptionPanelContainer';

import type {MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions';

type Props = {
    lang: string,
    messageBus: MashroomPortalMessageBus,
}

export default class RemoteMessagingApp extends PureComponent<Props> {

    render() {
        const { lang, messageBus } = this.props;
        let existingLang = lang;
        if (!messages[existingLang]) {
            existingLang = 'en';
        }

        return (
            <ReduxProvider store={store}>
                <IntlProvider messages={messages[existingLang]} locale={existingLang}>
                    <div className='mashroom-demo-remote-messaging-app'>
                        <MessageBusSendFormContainer messageBus={messageBus} />
                        <SubscriptionPanelContainer messageBus={messageBus} />
                        <MessageBusHistoryContainer />
                    </div>
                </IntlProvider>
            </ReduxProvider>
        );
    }

}
