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
import {addMessagePublishedByApp, setTopicsSubscribedByApp} from '../store/actions';

import type {
    MashroomPortalAppService,
    MashroomPortalMessageBus,
    MashroomPortalStateService
} from '@mashroom/mashroom-portal/type-definitions';
import type { DummyMessageBus as DummyMessageBusType } from '../../../type-definitions';

type Props = {
    lang: string,
    messageBus: MashroomPortalMessageBus,
    portalAppService: MashroomPortalAppService,
    portalStateService: MashroomPortalStateService,
}

export default class SandboxApp extends PureComponent<Props> {

    dummyMessageBus: DummyMessageBusType;

    constructor() {
        super();
        this.dummyMessageBus = new DummyMessageBus();
        this.dummyMessageBus.onMessageSent((topic, data) => {
            store.dispatch(addMessagePublishedByApp({
                topic,
                data
            }))
        });
        this.dummyMessageBus.onTopicsChanged((topics) => {
            store.dispatch(setTopicsSubscribedByApp(topics));
        });
    }

    render() {
        const { lang, messageBus, portalAppService, portalStateService } = this.props;
        let existingLang = lang;
        if (!messages[existingLang]) {
            existingLang = 'en';
        }

        return (
            <ReduxProvider store={store}>
                <IntlProvider messages={messages[existingLang]} locale={existingLang}>
                    <div className='mashroom-sandbox-app'>
                        <PortalAppHostContainer />
                        <MessageBusSendFormContainer messageBus={this.dummyMessageBus} />
                        <MessageBusHistoryContainer />
                        <PortalAppContainer
                            messageBus={messageBus}
                            dummyMessageBus={this.dummyMessageBus}
                            portalAppService={portalAppService}
                            portalStateService={portalStateService}
                        />
                    </div>
                </IntlProvider>
            </ReduxProvider>
        );
    }

}
