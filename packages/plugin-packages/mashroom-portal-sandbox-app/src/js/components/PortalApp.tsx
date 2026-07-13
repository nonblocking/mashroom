import React, { useEffect, useCallback } from 'react';
import {mergeAppConfig} from '../utils';
import {
    setActivePortalApp as setActivePortalAppAction,
    setAppLoadingError as setAppLoadingErrorAction,
    setHostWidth as setHostWidthAction,
    setKnownApps as setKnownAppsAction,
    setSelectedPortalApp as setSelectedPortalAppAction,
} from '../store/actions';
import useStore from '../store/useStore';
import PortalAppSelection from './PortalAppSelection';
import SelectedPortalAppConfig from './SelectedPortalAppConfig';
import ActivePortalAppDescription from './ActivePortalAppDescription';

import type {PortalAppQueryParams, ActivePortalApp, SelectedPortalApp} from '../types';
import type {
    MashroomKnownPortalApp,
    MashroomPortalAppService,
    MashroomPortalMessageBus,
} from '@mashroom/mashroom-portal/type-definitions';

type Props = {
    queryParams: PortalAppQueryParams;
    portalAppService: MashroomPortalAppService;
    messageBus: MashroomPortalMessageBus;
}

export default ({queryParams, portalAppService, messageBus}: Props) => {
    const activePortalApp = useStore((state) => state.activePortalApp);
    const dispatch = useStore((state) => state.dispatch);
    const setKnownApps = (availableApps: Array<MashroomKnownPortalApp>) => dispatch(setKnownAppsAction(availableApps));
    const setSelectedPortalApp = (app: SelectedPortalApp | undefined | null) => dispatch(setSelectedPortalAppAction(app));
    const setActivePortalApp = (app: ActivePortalApp | undefined | null) => dispatch(setActivePortalAppAction(app));
    const setHostWidth = (hostWidth: string) => dispatch(setHostWidthAction(hostWidth));
    const setAppLoadingError = (error: boolean) => dispatch(setAppLoadingErrorAction(error));

    const loadPortalAppInternal = useCallback(async (selectedPortalApp: SelectedPortalApp, hostWidth: string | undefined | null): Promise<void> => {
        console.info(`Loading app '${selectedPortalApp.appName}' with setup: `, selectedPortalApp.setup);
        setActivePortalApp(selectedPortalApp);
        if (hostWidth) {
            setHostWidth(hostWidth);
        }
    }, []);

    const selectionChanged = useCallback(async (appName: string | undefined | null): Promise<void> => {
        setTimeout(() => {
            messageBus.publish('mashroom-portal-sandbox-app-selection-change', {
                appName,
            });
        }, 250);

        if (!appName) {
            setSelectedPortalApp(null);
            return;
        }

        setAppLoadingError(false);
        try {
            const setup = await portalAppService.loadAppSetup(appName, null);
            const selectedPortalApp = {
                appName,
                setup
            };

            if (queryParams.appName) {
                // Auto load
                await loadPortalAppInternal(mergeAppConfig(selectedPortalApp, queryParams as any), queryParams.width);
            } else {
                setSelectedPortalApp(selectedPortalApp);
            }
        } catch (error) {
            setAppLoadingError(true);
            console.error('Loading app setup failed', error);
        }
    }, [queryParams, messageBus]);

    useEffect(() => {
        (async () => {
            try {
                const apps = await portalAppService.searchApps({includeNotPermitted: true});
                setKnownApps((apps || []).sort((app1, app2) => app1.name.localeCompare(app2.name)));
                if (queryParams.appName || queryParams.preselectAppName) {
                    // Auto select
                    await selectionChanged(queryParams.appName || queryParams.preselectAppName);
                }
            } catch (error) {
                console.error('Loading available apps failed', error);
            }
        })();
    }, [queryParams.appName, queryParams.preselectAppName, selectionChanged]);


    let content;
    if (activePortalApp) {
        content = (
            <ActivePortalAppDescription />
        );
    } else {
        content = (
            <>
                <PortalAppSelection preselectAppName={queryParams.preselectAppName} onSelectionChanged={selectionChanged} />
                <SelectedPortalAppConfig sbAutoTest={queryParams.autoTest} onConfigSubmit={loadPortalAppInternal} />
            </>
        );
    }

    return (
        <div className='mashroom-sandbox-app-selection'>
            {content}
        </div>
    );
};
