
import React, {useEffect, useMemo, useRef} from 'react';
import PrivateMessageBus from './PrivateMessageBus';
import type {MutableRefObject} from 'react';
import type {MashroomPortalMessageBus, MashroomPortalAppService} from '@mashroom/mashroom-portal/type-definitions';
import type {ActiveApp} from './types';

const DIALOG = [
    {
        name: 'Mashroom Portal Demo Angular App',
        appConfig: {
            pingButtonLabel: 'Next'
        }
    },
    {
        name: 'Mashroom Portal Demo Vue App',
        appConfig: {
            pingButtonLabel: 'Next'
        }
    },
    {
        name: 'Mashroom Portal Demo Svelte App',
        appConfig: {
            pingButtonLabel: 'Start over'
        }
    }
];

type Props = {
    appConfig: {
        firstName?: string;
    };
    messageBus: MashroomPortalMessageBus;
    portalAppService: MashroomPortalAppService;
}

const loadDialogPage = (dialogIdx: number, firstName: string | undefined, activeAppRef: MutableRefObject<ActiveApp | undefined>, dialogElementId: string, portalAppService: MashroomPortalAppService) => {
    if (activeAppRef.current) {
        // Unload current
        portalAppService.unloadApp(activeAppRef.current?.appId);
        activeAppRef.current = undefined;
    }
    portalAppService.loadApp(dialogElementId, DIALOG[dialogIdx].name, null, null, {
        ...DIALOG[dialogIdx].appConfig,
        firstName,
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
}

const onPing = (firstName: string | undefined, activeAppRef: MutableRefObject<ActiveApp | undefined>, dialogElementId: string, portalAppService: MashroomPortalAppService) => {
    if (!activeAppRef.current) {
        return;
    }
    const nextIdx = activeAppRef.current.dialogIdx < DIALOG.length - 1 ? activeAppRef.current.dialogIdx + 1 : 0;
    loadDialogPage(nextIdx, firstName, activeAppRef, dialogElementId, portalAppService);
};

export default ({appConfig, messageBus, portalAppService}: Props) => {
    const dialogElementId = useMemo(() => `_${Math.floor(Math.random() * 100000)}`, []);
    const activeAppRef = useRef<ActiveApp | undefined>();

    useEffect(() => {
        // Load first page
        loadDialogPage(0, appConfig.firstName, activeAppRef, dialogElementId, portalAppService);
        // Install a private message bus
        const privateMessageBus = new PrivateMessageBus(messageBus, activeAppRef,
            () => onPing(appConfig.firstName, activeAppRef, dialogElementId, portalAppService));
        return () => {
            privateMessageBus.uninstall();
        };
    }, []);

    return (
        <div className='mashroom-demo-composite-app'>
            <div className="info">
                <span className="info-icon" />
                This composite App uses an Angular, a Vue and a Svelte App to create a dialog.
                While the App itself is written in React.
            </div>
            <div id={dialogElementId} className="dialog" />
        </div>
    );
};
