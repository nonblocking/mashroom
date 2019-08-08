// @flow

import React, {PureComponent} from 'react';
import {IntlProvider} from 'react-intl';
import {Provider as ReduxProvider} from 'react-redux';
import DummyMessageBus from '../DummyMessageBus';
import store from '../store/store';
import messages from '../messages/messages';
import PortalAppHostContainer from '../containers/PortalAppHostContainer';
import PortalAppContainer from '../containers/PortalAppContainer';
import MessageBusHistoryContainer from '../containers/MessageBusHistoryContainer';
import MessageBusSendFormContainer from '../containers/MessageBusSendFormContainer';
import {addReceivedMessage, setSubscribedTopics} from '../store/actions';

import type {MashroomPortalAppService, MashroomPortalStateService} from '@mashroom/mashroom-portal/type-definitions';
import type { DummyMessageBus as DummyMessageBusType } from '../../../type-definitions';

type Props = {
    lang: string,
    portalAppService: MashroomPortalAppService,
    portalStateService: MashroomPortalStateService,
}

export default class SandboxApp extends PureComponent<Props> {

    messageBus: DummyMessageBusType;

    constructor() {
        super();
        this.messageBus = new DummyMessageBus();
        this.messageBus.onMessageSent((topic, data) => {
            store.dispatch(addReceivedMessage({
                topic,
                data
            }))
        });
        this.messageBus.onTopicsChanged((topics) => {
            store.dispatch(setSubscribedTopics(topics));
        });
    }

    render() {
        const { lang, portalAppService, portalStateService } = this.props;
        let existingLang = lang;
        if (!messages[existingLang]) {
            existingLang = 'en';
        }

        return (
            <ReduxProvider store={store}>
                <IntlProvider messages={messages[existingLang]} locale={existingLang}>
                    <div className='mashroom-sandbox-app'>
                        <PortalAppHostContainer />
                        <MessageBusSendFormContainer messageBus={this.messageBus} />
                        <MessageBusHistoryContainer />
                        <PortalAppContainer messageBus={this.messageBus} portalAppService={portalAppService} portalStateService={portalStateService} />
                    </div>
                </IntlProvider>
            </ReduxProvider>
        );
    }

}
