// @flow

import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';
import PortalAppConfigContainer from'../containers/PortalAppConfigContainer';
import PortalAppSelectionContainer from'../containers/PortalAppSelectionContainer';
import loadPortalApp from '../load_portal_app';
import {getQueryParams, mergeAppConfig} from '../utils';

import type {
    MashroomAvailablePortalApp,
    MashroomPortalAppService,
    MashroomPortalMessageBus,
    MashroomPortalStateService
} from '@mashroom/mashroom-portal/type-definitions';
import type {ActivePortalApp, DummyMessageBus, SelectedPortalApp} from '../../../type-definitions';

type Props = {
    portalAppService: MashroomPortalAppService,
    portalStateService: MashroomPortalStateService,
    messageBus: MashroomPortalMessageBus,
    dummyMessageBus: DummyMessageBus,
    activePortalApp: ?ActivePortalApp,
    setAvailablePortalApps: (Array<MashroomAvailablePortalApp>) => void,
    setSelectedPortalApp: (?SelectedPortalApp) => void,
    setActivePortalApp: (?ActivePortalApp) => void,
    setAppLoadingError: (boolean) => void,
    setHostWidth: (string) => void,
}

export default class PortalApp extends PureComponent<Props> {

    componentDidMount() {
        const { portalAppService, setAvailablePortalApps } = this.props;
        portalAppService.getAvailableApps().then(
            (apps) => {
                setAvailablePortalApps(apps);
                const queryParams = this.getQueryParams();
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

    getQueryParams() {
        const { portalStateService } = this.props;
        return getQueryParams(portalStateService);
    }

    selectionChanged(appName: ?string) {
        const { messageBus, portalAppService, setSelectedPortalApp, setAppLoadingError } = this.props;

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

                const queryParams = this.getQueryParams();
                if (queryParams.appName) {
                    // Auto load
                    this.loadPortalApp(mergeAppConfig(selectedPortalApp, (queryParams: any)), queryParams.width);
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

    loadPortalApp(selectedPortalApp: SelectedPortalApp, hostWidth: ?string) {
        console.info(`Loading app '${selectedPortalApp.appName}' with setup: `, selectedPortalApp.setup);

        const { dummyMessageBus, setActivePortalApp, setHostWidth } = this.props;
        const { appName, setup } = selectedPortalApp;
        setActivePortalApp(selectedPortalApp);

        if (hostWidth) {
            setHostWidth(hostWidth);
        }

        loadPortalApp(appName, 'mashroom-sandbox-app-host-elem', setup, dummyMessageBus).then(
            () => {},
            (error) => {
                console.error('Loading app failed', error);
            }
        );
    }

    renderNoActivePortalApp() {
        const { preselectAppName } = this.getQueryParams();

        return (
            <>
                <PortalAppSelectionContainer preselectAppName={preselectAppName} onSelectionChanged={(appName) => this.selectionChanged(appName)} />
                <PortalAppConfigContainer onConfigSubmit={(app, hostWidth) => this.loadPortalApp(app, hostWidth)} />
            </>
        );
    }

    renderActivePortalApp() {
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

    render() {
        const { activePortalApp } = this.props;

        return (
            <div className='mashroom-sandbox-app-selection'>
                {activePortalApp ? this.renderActivePortalApp() : this.renderNoActivePortalApp()}
            </div>
        );
    }

}
