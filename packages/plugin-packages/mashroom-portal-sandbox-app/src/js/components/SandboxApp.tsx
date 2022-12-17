
import React, {PureComponent} from 'react';
import {IntlProvider} from 'react-intl';
import {Provider as ReduxProvider} from 'react-redux';
import {nanoid} from 'nanoid';
import store from '../store/store';
import messages from '../messages/messages';
import getMessageBusPortalAppUnderTest from '../message_bus_portal_app_under_test';
import PortalAppHostContainer from '../containers/PortalAppHostContainer';
import PortalAppContainer from '../containers/PortalAppContainer';
import MessageBusHistoryContainer from '../containers/MessageBusHistoryContainer';
import MessageBusSendFormContainer from '../containers/MessageBusSendFormContainer';
import {addMessagePublishedByApp, setTopicsSubscribedByApp} from '../store/actions';

import { getQueryParams } from '../utils';
import type {ReactNode} from 'react';
import type {
    MashroomPortalAppService,
    MashroomPortalMessageBus,
    MashroomPortalStateService
} from '@mashroom/mashroom-portal/type-definitions';
import type { MessageBusPortalAppUnderTest, PortalAppQueryParams } from '../types';

type Props = {
    lang: string,
    messageBus: MashroomPortalMessageBus,
    portalAppService: MashroomPortalAppService,
    portalStateService: MashroomPortalStateService,
}

export default class SandboxApp extends PureComponent<Props> {

    hostElementId: string;
    messageBusPortalAppUnderTest: MessageBusPortalAppUnderTest;
    queryParams: PortalAppQueryParams;

    constructor(props: Props) {
        super(props);
        this.hostElementId = `mashroom-sandbox-app-host-elem_${nanoid(8)}`;
        this.messageBusPortalAppUnderTest = getMessageBusPortalAppUnderTest();
        this.messageBusPortalAppUnderTest.onMessageSent((topic, data) => {
            store.dispatch(addMessagePublishedByApp({
                topic,
                data
            }));
        });
        this.messageBusPortalAppUnderTest.onTopicsChanged((topics) => {
            store.dispatch(setTopicsSubscribedByApp(topics));
        });
        this.queryParams = getQueryParams(props.portalStateService);
    }

    render(): ReactNode {
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
                        <MessageBusSendFormContainer
                            messageBus={messageBus}
                            portalStateService={portalStateService}
                            sbAutoTest={this.queryParams.autoTest}
                        />
                        <MessageBusHistoryContainer />
                        <PortalAppContainer
                            hostElementId={this.hostElementId}
                            queryParams={this.queryParams}
                            messageBus={messageBus}
                            messageBusPortalAppUnderTest={this.messageBusPortalAppUnderTest}
                            portalAppService={portalAppService}
                        />
                    </div>
                </IntlProvider>
            </ReduxProvider>
        );
    }

}
