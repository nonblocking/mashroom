
import React, {PureComponent} from 'react';
import {IntlProvider} from 'react-intl';
import {Provider as ReduxProvider} from 'react-redux';
import {nanoid} from 'nanoid';
import store from '../store/store';
import messages from '../messages/messages';
import getMessageBusPortalAppUnderTest from '../message-bus-portal-app-under-test';
import {addMessagePublishedByApp, setTopicsSubscribedByApp} from '../store/actions';
import { getQueryParams } from '../utils';
import PortalAppHost from './PortalAppHost';
import PortalApp from './PortalApp';
import PortalAppStats from './PortalAppStats';
import MessageBusSendForm from './MessageBusSendForm';
import MessageBusHistory from './MessageBusHistory';

import type {
    MashroomPortalAppService,
    MashroomPortalMessageBus,
    MashroomPortalStateService
} from '@mashroom/mashroom-portal/type-definitions';
import type { MessageBusPortalAppUnderTest, PortalAppQueryParams } from '../types';

type Props = {
    lang: string;
    messageBus: MashroomPortalMessageBus;
    portalAppService: MashroomPortalAppService;
    portalStateService: MashroomPortalStateService;
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

    render() {
        const { lang, messageBus, portalAppService } = this.props;
        let existingLang = lang;
        if (!messages[existingLang]) {
            existingLang = 'en';
        }

        return (
            <ReduxProvider store={store}>
                <IntlProvider messages={messages[existingLang]} locale={existingLang}>
                    <div className='mashroom-sandbox-app'>
                        <PortalAppHost hostElementId={this.hostElementId} />
                        <PortalAppStats portalAppService={portalAppService} />
                        <MessageBusSendForm
                            messageBus={messageBus}
                            sbAutoTest={this.queryParams.autoTest}
                        />
                        <MessageBusHistory />
                        <PortalApp
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
