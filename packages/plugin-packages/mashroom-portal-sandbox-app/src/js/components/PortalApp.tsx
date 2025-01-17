
import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';
import PortalAppConfigContainer from'../containers/PortalAppConfigContainer';
import PortalAppSelectionContainer from'../containers/PortalAppSelectionContainer';
import loadPortalApp from '../load-portal-app';
import {mergeAppConfig} from '../utils';
import {
    QUERY_PARAM_APP_NAME,
    QUERY_PARAM_APP_CONFIG,
    QUERY_PARAM_PERMISSIONS,
    QUERY_PARAM_LANG,
    QUERY_PARAM_WIDTH
} from '../constants';

import type {PortalAppQueryParams,ActivePortalApp, SelectedPortalApp, MessageBusPortalAppUnderTest} from '../types';
import type {ReactNode} from 'react';
import type {
    MashroomKnownPortalApp,
    MashroomPortalAppService,
    MashroomPortalMessageBus,
} from '@mashroom/mashroom-portal/type-definitions';

type Props = {
    hostElementId: string;
    hostWidth: string;
    queryParams: PortalAppQueryParams;
    portalAppService: MashroomPortalAppService;
    messageBus: MashroomPortalMessageBus;
    messageBusPortalAppUnderTest: MessageBusPortalAppUnderTest;
    activePortalApp: ActivePortalApp | undefined | null;
    setKnownApps: (apps: Array<MashroomKnownPortalApp>) => void;
    setSelectedPortalApp: (app: SelectedPortalApp | undefined | null) => void;
    setActivePortalApp: (app: ActivePortalApp | undefined | null) => void;
    setAppLoadingError: (error: boolean) => void;
    setHostWidth: (width: string) => void;
}

type State = {
    permalinkCopiedToClipboard: boolean;
}

export default class PortalApp extends PureComponent<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            permalinkCopiedToClipboard: false,
        };
    }

    componentDidMount(): void {
        const { queryParams, portalAppService, setKnownApps } = this.props;
        portalAppService.searchApps({ includeNotPermitted: true }).then(
            (apps) => {
                setKnownApps((apps || []).sort((app1, app2) => app1.name.localeCompare(app2.name)));
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

    copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
        this.setState({
            permalinkCopiedToClipboard: true,
        });
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
        const { activePortalApp, hostWidth } = this.props;
        if (!activePortalApp) {
            return null;
        }

        const queryParams: Array<string> = [];
        queryParams.push(`${QUERY_PARAM_APP_NAME}=${encodeURIComponent(activePortalApp.appName)}`);
        queryParams.push(`${QUERY_PARAM_APP_CONFIG}=${btoa(JSON.stringify(activePortalApp.setup.appConfig))}`);
        queryParams.push(`${QUERY_PARAM_PERMISSIONS}=${btoa(JSON.stringify(activePortalApp.setup.user.permissions))}`);
        queryParams.push(`${QUERY_PARAM_LANG}=${activePortalApp.setup.lang}`);
        queryParams.push(`${QUERY_PARAM_WIDTH}=${encodeURIComponent(hostWidth)}`);
        const permalink = `${document.location.origin + document.location.pathname}?${queryParams.join('&')}`;

        return (
            <>
                <div className='mashroom-sandbox-app-output-row'>
                    <div>
                        <FormattedMessage id='sandboxPermalink' />
                    </div>
                    <div>
                        <a href={permalink} target='_blank' rel="noreferrer">
                            <FormattedMessage id='link' />
                        </a>
                        <div className='mashroom-sandbox-copy-permalink' onClick={() => this.copyToClipboard(permalink)}></div>
                        {this.state.permalinkCopiedToClipboard && (
                            <div className='mashroom-sandbox-permalink-copied'>
                                <FormattedMessage id='copiedToClipboard' />
                            </div>
                        )}
                    </div>
                </div>
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
        const {activePortalApp} = this.props;

        return (
            <div className='mashroom-sandbox-app-selection'>
                {activePortalApp ? this.renderActivePortalApp() : this.renderNoActivePortalApp()}
            </div>
        );
    }

}
