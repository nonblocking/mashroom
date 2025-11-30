import React, { useState, useEffect, useCallback } from 'react';
import {useTranslation} from 'react-i18next';
import loadPortalApp from '../load-portal-app';
import { mergeAppConfig } from '../utils';
import {
    QUERY_PARAM_APP_NAME,
    QUERY_PARAM_APP_CONFIG,
    QUERY_PARAM_PERMISSIONS,
    QUERY_PARAM_LANG,
    QUERY_PARAM_WIDTH
} from '../constants';
import {
    setActivePortalApp as setActivePortalAppAction,
    setAppLoadingError as setAppLoadingErrorAction,
    setHostWidth as setHostWidthAction,
    setKnownApps as setKnownAppsAction,
    setSelectedPortalApp as setSelectedPortalAppAction,
} from '../store/actions';
import useStore from '../store/useStore';
import PortalAppSelection from './PortalAppSelection';
import PortalAppConfig from './PortalAppConfig';

import type {PortalAppQueryParams, ActivePortalApp, SelectedPortalApp, MessageBusPortalAppUnderTest} from '../types';
import type {
    MashroomKnownPortalApp,
    MashroomPortalAppService,
    MashroomPortalMessageBus,
} from '@mashroom/mashroom-portal/type-definitions';

type Props = {
    hostElementId: string;
    queryParams: PortalAppQueryParams;
    portalAppService: MashroomPortalAppService;
    messageBus: MashroomPortalMessageBus;
    messageBusPortalAppUnderTest: MessageBusPortalAppUnderTest;
}

export default ({hostElementId, queryParams, portalAppService, messageBus, messageBusPortalAppUnderTest}: Props) => {
    const {t} = useTranslation();
    const [permalinkCopiedToClipboard, setPermalinkCopiedToClipboard] = useState<boolean>(false);
    const activePortalApp = useStore((state) => state.activePortalApp);
    const {width: currentHostWidth} = useStore((state) => state.host);
    const dispatch = useStore((state) => state.dispatch);
    const setKnownApps = (availableApps: Array<MashroomKnownPortalApp>) => dispatch(setKnownAppsAction(availableApps));
    const setSelectedPortalApp = (app: SelectedPortalApp | undefined | null) => dispatch(setSelectedPortalAppAction(app));
    const setActivePortalApp = (app: ActivePortalApp | undefined | null) => dispatch(setActivePortalAppAction(app));
    const setHostWidth = (hostWidth: string) => dispatch(setHostWidthAction(hostWidth));
    const setAppLoadingError = (error: boolean) => dispatch(setAppLoadingErrorAction(error));

    const loadPortalAppInternal = useCallback(async (selectedPortalApp: SelectedPortalApp, hostWidth: string | undefined | null): Promise<void> => {
        console.info(`Loading app '${selectedPortalApp.appName}' with setup: `, selectedPortalApp.setup);

        const {appName, setup} = selectedPortalApp;
        setActivePortalApp(selectedPortalApp);

        if (hostWidth) {
            setHostWidth(hostWidth);
        }

        try {
            await loadPortalApp(appName, hostElementId, setup, messageBusPortalAppUnderTest);
        } catch (error) {
            console.error('Loading app failed', error);
        }
    }, [hostElementId, messageBusPortalAppUnderTest]);


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
        const loadApps = async () => {
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
        };

        loadApps();
    }, [queryParams.appName, queryParams.preselectAppName, selectionChanged]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setPermalinkCopiedToClipboard(true);
        // Optionally, reset the message after a few seconds
        setTimeout(() => setPermalinkCopiedToClipboard(false), 3000);
    };

    let content;

    if (activePortalApp) {
        const queryParamsArray: Array<string> = [];
        queryParamsArray.push(`${QUERY_PARAM_APP_NAME}=${encodeURIComponent(activePortalApp.appName)}`);
        queryParamsArray.push(`${QUERY_PARAM_APP_CONFIG}=${btoa(JSON.stringify(activePortalApp.setup.appConfig))}`);
        queryParamsArray.push(`${QUERY_PARAM_PERMISSIONS}=${btoa(JSON.stringify(activePortalApp.setup.user.permissions))}`);
        queryParamsArray.push(`${QUERY_PARAM_LANG}=${activePortalApp.setup.lang}`);
        queryParamsArray.push(`${QUERY_PARAM_WIDTH}=${encodeURIComponent(currentHostWidth)}`);
        const permalink = `${document.location.origin + document.location.pathname}?${queryParamsArray.join('&')}`;

        content = (
            <>
                <div className='mashroom-sandbox-app-output-row'>
                    <div>
                        {t('sandboxPermalink')}
                    </div>
                    <div>
                        <a href={permalink} target='_blank' rel="noreferrer">
                            {t('link')}
                        </a>
                        <div className='mashroom-sandbox-copy-permalink' onClick={() => copyToClipboard(permalink)}></div>
                        {permalinkCopiedToClipboard && (
                            <div className='mashroom-sandbox-permalink-copied'>
                                {t('copiedToClipboard')}
                            </div>
                        )}
                    </div>
                </div>
                <div className='mashroom-sandbox-app-output-row'>
                    <div>
                        {t('appName')}
                    </div>
                    <div>
                        <strong id='mashroom-sandbox-app-name'>{activePortalApp.appName}</strong>
                    </div>
                </div>
                <div className='mashroom-sandbox-app-output-row'>
                    <div>
                        {t('appSetup')}
                    </div>
                    <div>
                        <pre id='mashroom-sandbox-app-setup'>{JSON.stringify(activePortalApp.setup, null, 2)}</pre>
                    </div>
                </div>
            </>
        );
    } else {
        content = (
            <>
                <PortalAppSelection preselectAppName={queryParams.preselectAppName} onSelectionChanged={selectionChanged} />
                <PortalAppConfig sbAutoTest={queryParams.autoTest} onConfigSubmit={loadPortalAppInternal} />
            </>
        );
    }

    return (
        <div className='mashroom-sandbox-app-selection'>
            {content}
        </div>
    );
};
