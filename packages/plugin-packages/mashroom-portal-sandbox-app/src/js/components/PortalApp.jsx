// @flow

import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';
import PortalAppConfig from'./PortalAppConfig';
import PortalAppSelection from'./PortalAppSelection';
import loadPortalApp from '../load_portal_app';
import {getQueryParams, mergeAppConfig} from '../utils';

import type {
    MashroomAvailablePortalApp,
    MashroomPortalAppService,
    MashroomPortalStateService
} from '@mashroom/mashroom-portal/type-definitions';
import type {ActivePortalApp, DummyMessageBus, SelectedPortalApp} from '../../../type-definitions';

type Props = {
    portalAppService: MashroomPortalAppService,
    portalStateService: MashroomPortalStateService,
    hostWidth: string,
    messageBus: DummyMessageBus,
    availablePortalApps: Array<MashroomAvailablePortalApp>,
    selectedPortalApp: ?SelectedPortalApp,
    activePortalApp: ?ActivePortalApp,
    setAvailablePortalApps: (Array<MashroomAvailablePortalApp>) => void,
    setSelectedPortalApp: (?SelectedPortalApp) => void,
    setActivePortalApp: (?ActivePortalApp) => void,
    setHostWidth: (string) => void,
}

export default class PortalApp extends PureComponent<Props> {

    componentDidMount() {
        const { portalAppService, setAvailablePortalApps } = this.props;
        portalAppService.getAvailableApps().then(
            (apps) => {
                setAvailablePortalApps(apps);
                const queryParams = this.getQueryParams();
                if (queryParams) {
                    // Auto select
                    this.selectionChanged(queryParams.appName);
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
        const { portalAppService, setSelectedPortalApp } = this.props;
        if (!appName) {
            setSelectedPortalApp(null);
            return;
        }

        portalAppService.loadAppSetup(appName, null).then(
            (setup) => {
                const selectedPortalApp = {
                    appName,
                    setup
                };


                const queryParams = this.getQueryParams();
                if (queryParams){
                    // Auto load
                    this.loadPortalApp(mergeAppConfig(selectedPortalApp, queryParams), queryParams.width);
                } else {
                    setSelectedPortalApp(selectedPortalApp);
                }
            },
            (error) => {
                console.error('Loading app setup failed', error);
            }
        );
    }

    loadPortalApp(selectedPortalApp: SelectedPortalApp, hostWidth: ?string) {
        console.info(`Loading app '${selectedPortalApp.appName}' with setup: `, selectedPortalApp.setup);

        const { messageBus, setActivePortalApp, setHostWidth } = this.props;
        const { appName, setup } = selectedPortalApp;
        setActivePortalApp(selectedPortalApp);

        if (hostWidth) {
            setHostWidth(hostWidth);
        }

        loadPortalApp(appName, 'mashroom-sandbox-app-host-elem', setup, messageBus).then(
            () => {},
            (error) => {
                console.error('Loading app failed', error);
            }
        );
    }

    renderNoActivePortalApp() {
        const { availablePortalApps, selectedPortalApp, hostWidth } = this.props;

        return (
            <>
                <PortalAppSelection availablePortalApps={availablePortalApps} selectionChanged={(appName) => this.selectionChanged(appName)} />
                <PortalAppConfig selectedPortalApp={selectedPortalApp} hostWidth={hostWidth} onConfigSubmit={(app, hostWidth) => this.loadPortalApp(app, hostWidth)} />
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
                    <FormattedMessage id='appName' />
                    <strong id='mashroom-sandbox-app-name'>{activePortalApp.appName}</strong>
                </div>
                <div className='mashroom-sandbox-app-output-row'>
                    <FormattedMessage id='appSetup' />
                    <pre id='mashroom-sandbox-app-setup'>{JSON.stringify(activePortalApp.setup, null, 2)}</pre>
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
