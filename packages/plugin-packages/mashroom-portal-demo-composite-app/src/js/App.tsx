
import React, {useEffect, useRef} from 'react';
import PrivateMessageBus from './PrivateMessageBus';
import DIALOG from './dialog';
import {getDialogHostElementId} from './utils';

import type {MutableRefObject} from 'react';
import type {MashroomPortalMessageBus, MashroomPortalAppService} from '@mashroom/mashroom-portal/type-definitions';
import type {ActiveApp} from './types';

type Props = {
    appId: string;
    messageBus: MashroomPortalMessageBus;
    portalAppService: MashroomPortalAppService;
}

const loadDialogPage = (dialogIdx: number,activeAppRef: MutableRefObject<ActiveApp | undefined>, dialogElementId: string, portalAppService: MashroomPortalAppService) => {
    if (activeAppRef.current) {
        // Unload current
        portalAppService.unloadApp(activeAppRef.current?.appId);
        activeAppRef.current = undefined;
    }
    portalAppService.loadApp(dialogElementId, DIALOG[dialogIdx].name, null, null, {
        ...DIALOG[dialogIdx].appConfig,
    }).then(
        (portalApp) => {
            if (!portalApp.error) {
                activeAppRef.current = {
                    dialogIdx,
                    appId: portalApp.id,
                };
            } else {
                console.error(`Loading App ${DIALOG[dialogIdx].name} failed`);
            }
        },
        (error) => {
            console.error(`Loading App ${DIALOG[dialogIdx].name} failed`, error);
        }
    );
};

const onPing = (activeAppRef: MutableRefObject<ActiveApp | undefined>, dialogElementId: string, portalAppService: MashroomPortalAppService) => {
    if (!activeAppRef.current) {
        return;
    }
    const nextIdx = activeAppRef.current.dialogIdx < DIALOG.length - 1 ? activeAppRef.current.dialogIdx + 1 : 0;
    loadDialogPage(nextIdx, activeAppRef, dialogElementId, portalAppService);
};

export default ({appId, messageBus, portalAppService}: Props) => {
    const dialogHostElementId = getDialogHostElementId(appId);
    const activeAppRef = useRef<ActiveApp | undefined>();

    useEffect(() => {
        const dialogIdx = 0;
        const ssrPreloadedApp = portalAppService.loadedPortalApps.find(({ pluginName, portalAppAreaId }) => pluginName === DIALOG[dialogIdx].name && portalAppAreaId === dialogHostElementId);
        if (ssrPreloadedApp) {
            // First App already loaded (integrated on the server-side)
            activeAppRef.current = {
                dialogIdx,
                appId: ssrPreloadedApp.id,
            };
        } else {
            // Load first App client-side
            loadDialogPage(dialogIdx, activeAppRef, dialogHostElementId, portalAppService);
        }
        // Install a private message bus
        const privateMessageBus = new PrivateMessageBus(messageBus, activeAppRef,
            () => onPing(activeAppRef, dialogHostElementId, portalAppService));
        return () => {
            privateMessageBus.uninstall();
        };
    }, []);

    return (
        <div className='mashroom-demo-composite-app'>
            <div className="info">
                <span className="info-icon" />
                This <strong>Composite App</strong> uses a Vue, an Angular and a Svelte App to create a dialog.
                While the App itself is written in React.
                <br/><br/>
                This App is also capable of server-side rendering itself and the first <em>embedded</em> App.
            </div>
            { /* dangerouslySetInnerHTML is necessary here to prevent the server-side content of this div to be removed during hydration! */ }
            <div id={dialogHostElementId} className="dialog" dangerouslySetInnerHTML={{ __html: '' }} />
        </div>
    );
};
