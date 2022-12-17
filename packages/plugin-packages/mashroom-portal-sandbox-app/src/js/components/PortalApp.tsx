
import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';
import PortalAppConfigContainer from'../containers/PortalAppConfigContainer';
import PortalAppSelectionContainer from'../containers/PortalAppSelectionContainer';
import loadPortalApp from '../load_portal_app';
import {mergeAppConfig} from '../utils';

import type {PortalAppQueryParams,ActivePortalApp, SelectedPortalApp, MessageBusPortalAppUnderTest} from '../types';
import type {ReactNode} from 'react';
import type {
    MashroomAvailablePortalApp,
    MashroomPortalAppService,
    MashroomPortalMessageBus,
} from '@mashroom/mashroom-portal/type-definitions';

type Props = {
    hostElementId: string;
    queryParams: PortalAppQueryParams;
    portalAppService: MashroomPortalAppService;
    messageBus: MashroomPortalMessageBus;
    messageBusPortalAppUnderTest: MessageBusPortalAppUnderTest;
    activePortalApp: ActivePortalApp | undefined | null;
    setAvailablePortalApps: (apps: Array<MashroomAvailablePortalApp>) => void;
    setSelectedPortalApp: (app: SelectedPortalApp | undefined | null) => void;
    setActivePortalApp: (app: ActivePortalApp | undefined | null) => void;
    setAppLoadingError: (error: boolean) => void;
    setHostWidth: (width: string) => void;
}

export default class PortalApp extends PureComponent<Props> {

    componentDidMount(): void {
        const { queryParams, portalAppService, setAvailablePortalApps } = this.props;
        portalAppService.getAvailableApps().then(
            (apps) => {
                setAvailablePortalApps((apps || []).sort((app1, app2) => app1.name.localeCompare(app2.name)));
                if (queryParams.appName || queryParams.preselectAppName) {
                    // Auto select
                    this.selectionChanged(queryParams.appName|| queryParams.preselectAppName);
                }
            },
            (error) => {
                console.error('Loading available apps failed', error);
            }
        );
    }

    selectionChanged(appName: string | undefined | null): void {
        const { queryParams, messageBus, portalAppService, setSelectedPortalApp, setAppLoadingError } = this.props;

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
        portalAppService.loadAppSetup(appName, null).then(
            (setup) => {
                const selectedPortalApp = {
                    appName,
                    setup
                };

                if (queryParams.appName) {
                    // Auto load
                    this.loadPortalApp(mergeAppConfig(selectedPortalApp, queryParams as any), queryParams.width);
                } else {
                    setSelectedPortalApp(selectedPortalApp);
                }
            },
            (error) => {
                setAppLoadingError(true);
                console.error('Loading app setup failed', error);
            }
        );
    }

    loadPortalApp(selectedPortalApp: SelectedPortalApp, hostWidth: string | undefined | null): void {
        console.info(`Loading app '${selectedPortalApp.appName}' with setup: `, selectedPortalApp.setup);

        const { hostElementId, messageBusPortalAppUnderTest, setActivePortalApp, setHostWidth } = this.props;
        const { appName, setup } = selectedPortalApp;
        setActivePortalApp(selectedPortalApp);

        if (hostWidth) {
            setHostWidth(hostWidth);
        }

        loadPortalApp(appName, hostElementId, setup, messageBusPortalAppUnderTest).then(
            () => {
                // Nothing to do
            },
            (error) => {
                console.error('Loading app failed', error);
            }
        );
    }

    renderNoActivePortalApp(): ReactNode {
        const { queryParams } = this.props;

        return (
            <>
                <PortalAppSelectionContainer preselectAppName={queryParams.preselectAppName} onSelectionChanged={(appName) => this.selectionChanged(appName)} />
                <PortalAppConfigContainer sbAutoTest={queryParams.autoTest} onConfigSubmit={(app, hostWidth) => this.loadPortalApp(app, hostWidth)} />
            </>
        );
    }

    renderActivePortalApp(): ReactNode {
        const { activePortalApp } = this.props;
        if (!activePortalApp) {
            return null;
        }

        return (
            <>
                <div className='mashroom-sandbox-app-output-row'>
                    <div>
                        <FormattedMessage id='appName' />
                    </div>
                    <div>
                        <strong id='mashroom-sandbox-app-name'>{activePortalApp.appName}</strong>
                    </div>
                </div>
                <div className='mashroom-sandbox-app-output-row'>
                    <div>
                        <FormattedMessage id='appSetup' />
                    </div>
                    <div>
                        <pre id='mashroom-sandbox-app-setup'>{JSON.stringify(activePortalApp.setup, null, 2)}</pre>
                    </div>
                </div>
            </>
        );
    }

    render(): ReactNode {
        const { activePortalApp } = this.props;

        return (
            <div className='mashroom-sandbox-app-selection'>
                {activePortalApp ? this.renderActivePortalApp() : this.renderNoActivePortalApp()}
            </div>
        );
    }

}
