
import React, {useMemo} from 'react';
import MessagesProvider from '../messages/MessagesProvider';
import { getQueryParams } from '../utils';
import {StoreProvider} from '../store/useStore';
import ActivePortalAppHost from './ActivePortalAppHost';
import PortalApp from './PortalApp';
import ActivePortalAppStats from './ActivePortalAppStats';
import ActivePortalAppMessageBusSendForm from './ActivePortalAppMessageBusSendForm';
import ActivePortalAppMessageBusHistory from './ActivePortalAppMessageBusHistory';
import ActivePortalAppClose from './ActivePortalAppClose';

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
    const queryParams = useMemo(() => getQueryParams(portalStateService), []);
    console.info('Sandbox App started with query params: ', queryParams);

    return (
        <StoreProvider>
            <MessagesProvider lang={lang}>
                <div className='mashroom-sandbox-app'>
                    <ActivePortalAppHost />
                    <ActivePortalAppStats portalAppService={portalAppService} />
                    <ActivePortalAppClose />
                    <ActivePortalAppMessageBusSendForm
                        messageBus={messageBus}
                        sbAutoTest={queryParams.autoTest}
                    />
                    <ActivePortalAppMessageBusHistory />
                    <PortalApp
                        queryParams={queryParams}
                        messageBus={messageBus}
                        portalAppService={portalAppService}
                    />
                </div>
            </MessagesProvider>
        </StoreProvider>
    );
};
