
import React, {PureComponent} from 'react';
import {IntlProvider} from 'react-intl';
import {Provider as ReduxProvider} from 'react-redux';
import shortId from 'shortid';
import store from '../store/store';
import messages from '../messages/messages';
import getMessageBusPortalAppUnderTest from '../message_bus_portal_app_under_test';
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
import type { MessageBusPortalAppUnderTest } from '../types';

type Props = {
    lang: string,
    messageBus: MashroomPortalMessageBus,
    portalAppService: MashroomPortalAppService,
    portalStateService: MashroomPortalStateService,
}

export default class SandboxApp extends PureComponent<Props> {

    hostElementId: string;
    messageBusPortalAppUnderTest: MessageBusPortalAppUnderTest;

    constructor(props: Props) {
        super(props);
        this.hostElementId = `mashroom-sandbox-app-host-elem_${shortId()}`;
        this.messageBusPortalAppUnderTest = getMessageBusPortalAppUnderTest();
        this.messageBusPortalAppUnderTest.onMessageSent((topic, data) => {
            store.dispatch(addMessagePublishedByApp({
                topic,
                data
            }))
        });
        this.messageBusPortalAppUnderTest.onTopicsChanged((topics) => {
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
                        <PortalAppHostContainer hostElementId={this.hostElementId} />
                        <MessageBusSendFormContainer messageBus={messageBus} />
                        <MessageBusHistoryContainer />
                        <PortalAppContainer
                            hostElementId={this.hostElementId}
                            messageBus={messageBus}
                            messageBusPortalAppUnderTest={this.messageBusPortalAppUnderTest}
                            portalAppService={portalAppService}
                            portalStateService={portalStateService}
                        />
                    </div>
                </IntlProvider>
            </ReduxProvider>
        );
    }

}
