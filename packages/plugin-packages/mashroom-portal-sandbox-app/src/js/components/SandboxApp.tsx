
import React, {useEffect, useMemo} from 'react';
import {nanoid} from 'nanoid';
import MessagesProvider from '../messages/MessagesProvider';
import getMessageBusPortalAppUnderTest from '../message-bus-portal-app-under-test';
import {addMessagePublishedByApp, setTopicsSubscribedByApp} from '../store/actions';
import { getQueryParams } from '../utils';
import useStore from '../store/useStore';
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

type Props = {
    lang: string;
    messageBus: MashroomPortalMessageBus;
    portalAppService: MashroomPortalAppService;
    portalStateService: MashroomPortalStateService;
}

export default ({lang, messageBus, portalAppService, portalStateService}: Props) => {
    const hostElementId = useMemo(() => `mashroom-sandbox-app-host-elem_${nanoid(8)}`, []);
    const queryParams = useMemo(() => getQueryParams(portalStateService), []);
    const messageBusPortalAppUnderTest = useMemo(() => getMessageBusPortalAppUnderTest(), []);
    const dispatch = useStore((state) => state.dispatch);

    useEffect(() => {
        messageBusPortalAppUnderTest.onMessageSent((topic, data) => {
            dispatch(addMessagePublishedByApp({
                topic,
                data
            }));
        });
        messageBusPortalAppUnderTest.onTopicsChanged((topics) => {
            dispatch(setTopicsSubscribedByApp(topics));
        });
    }, []);

    return (
        <MessagesProvider lang={lang}>
            <div className='mashroom-sandbox-app'>
                <PortalAppHost hostElementId={hostElementId} />
                <PortalAppStats portalAppService={portalAppService} />
                <MessageBusSendForm
                    messageBus={messageBus}
                    sbAutoTest={queryParams.autoTest}
                />
                <MessageBusHistory />
                <PortalApp
                    hostElementId={hostElementId}
                    queryParams={queryParams}
                    messageBus={messageBus}
                    messageBusPortalAppUnderTest={messageBusPortalAppUnderTest}
                    portalAppService={portalAppService}
                />
            </div>
        </MessagesProvider>
    );
};
