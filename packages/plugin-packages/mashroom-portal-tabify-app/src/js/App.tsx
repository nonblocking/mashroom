
import React, {PureComponent} from 'react';

import type {ReactNode} from 'react';
import type {
    MashroomPortalLoadedPortalApp,
    MashroomPortalAppService,
    MashroomPortalAppLoadListener,
    MashroomPortalMessageBus,
    MashroomPortalMessageBusSubscriberCallback,
} from '@mashroom/mashroom-portal/type-definitions';

type Tab = {
    wrapper: HTMLElement,
    app: MashroomPortalLoadedPortalApp
}

type Message = {
    appId?: string | undefined;
    title?: string | undefined;
    pluginName?: string | undefined;
}

type Props = {
    tabifyPluginName: string;
    hostElement: HTMLElement;
    appConfig: {
        addCloseButtons?: boolean;
        pluginNameTitleMapping?: {
            [pluginName: string]: string
        };
        fixedTabTitles?: Array<string | null | undefined>;
    };
    messageBus: MashroomPortalMessageBus;
    portalAppService: MashroomPortalAppService;
}

type State = {
    activeTabIndex: number | undefined | null;
    pluginNameTitleMapping: {
        [pluginName: string]: string;
    };
    appIdTitleMapping: {
        [pluginName: string]: string;
    };
    tabs: Array<Tab>;
}

const ADD_PLUGIN_NAME_TITLE_MAPPING_TOPIC = 'tabify-add-plugin-name-title-mapping';
const ADD_APP_ID_TITLE_MAPPING_TOPIC = 'tabify-add-app-id-title-mapping';
const FOCUS_APP_TOPIC = 'tabify-focus-app';

export default class App extends PureComponent<Props, State> {

    private _areaId: string | undefined;
    private _boundOnAppLoaded: MashroomPortalAppLoadListener;
    private _boundOnAppUnload: MashroomPortalAppLoadListener;
    private _boundOnPluginNameTitleMappingMessage: MashroomPortalMessageBusSubscriberCallback;
    private _boundOnAppIdTitleMappingMessage: MashroomPortalMessageBusSubscriberCallback;
    private _boundOnFocusAppMessage: MashroomPortalMessageBusSubscriberCallback;

    constructor(props: Props) {
        super(props);
        this.state = {
            activeTabIndex: null,
            pluginNameTitleMapping: {},
            appIdTitleMapping: {},
            tabs: [],
        };

        this._boundOnAppLoaded = this.onAppLoaded.bind(this);
        this._boundOnAppUnload = this.onAppUnload.bind(this);
        this._boundOnPluginNameTitleMappingMessage = this.onPluginNameTitleMappingMessage.bind(this);
        this._boundOnAppIdTitleMappingMessage = this.onAppIdTitleMappingMessage.bind(this);
        this._boundOnFocusAppMessage = this.onFocusAppMessage.bind(this);
    }

    createAppWrapper(app: MashroomPortalLoadedPortalApp): HTMLElement {
        // Hide the app header
        app.portalAppWrapperElement.classList.add('hide-header');

        // Find the outermost wrapper
        let currentWrapper: HTMLElement = app.portalAppWrapperElement;
        while (currentWrapper.parentElement && currentWrapper.parentElement.id !== app.portalAppAreaId) {
            currentWrapper = currentWrapper.parentElement;
        }

        const appAreaElement = currentWrapper.parentElement;
        if (!appAreaElement) {
            return currentWrapper;
        }

        const newWrapper = document.createElement('div');
        newWrapper.className = 'mashroom-portal-tabify-app-wrapper';
        appAreaElement.insertBefore(newWrapper, currentWrapper);
        newWrapper.appendChild(currentWrapper);

        return newWrapper;
    }

    removeAppWrapper(tab: Tab): void {
        const previousWrapper = tab.wrapper.firstChild;
        const appAreaElement = tab.wrapper.parentElement;
        if (previousWrapper && appAreaElement) {
            appAreaElement.insertBefore(previousWrapper, tab.wrapper);
            appAreaElement.removeChild(tab.wrapper);
        }
        tab.app.portalAppWrapperElement.classList.remove('hide-header');
    }

    removeAllAppWrappers(): void {
        this.state.tabs.forEach((tab) => {
            this.removeAppWrapper(tab);
        });
    }

    componentDidMount(): void {
        const tabifyApp = this.props.portalAppService.loadedPortalApps.find((app) => app.portalAppHostElement === this.props.hostElement);
        if (tabifyApp) {
            tabifyApp.portalAppWrapperElement.classList.add('no-border');
            tabifyApp.portalAppWrapperElement.classList.add('no-margin');
            tabifyApp.portalAppWrapperElement.classList.add('hide-header');

            this._areaId = tabifyApp.portalAppAreaId;
            const areaApps = this.props.portalAppService.loadedPortalApps.filter((app) => app.pluginName !== this.props.tabifyPluginName && app.portalAppAreaId === this._areaId);
            const tabs: Array<Tab> = [];

            // Hide all apps
            areaApps.forEach((app, idx) => {
                const wrapper = this.createAppWrapper(app);
                tabs.push({
                    wrapper,
                    app

                });

                if (idx !== 0) {
                    wrapper.style.display = 'none';
                }
            });

            this.setState({
                activeTabIndex: 0,
                pluginNameTitleMapping: this.props.appConfig.pluginNameTitleMapping || {},
                tabs
            });

            setTimeout(() => {
                this.focusFirstInputOnActiveTab();
            }, 50);

            this.props.portalAppService.registerAppLoadedListener(this._boundOnAppLoaded);
            this.props.portalAppService.registerAppAboutToUnloadListener(this._boundOnAppUnload);

            this.props.messageBus.subscribe(ADD_PLUGIN_NAME_TITLE_MAPPING_TOPIC, this._boundOnPluginNameTitleMappingMessage);
            this.props.messageBus.subscribe(ADD_APP_ID_TITLE_MAPPING_TOPIC, this._boundOnAppIdTitleMappingMessage);
            this.props.messageBus.subscribe(FOCUS_APP_TOPIC, this._boundOnFocusAppMessage);
        }
    }

    componentWillUnmount(): void {
        this.props.portalAppService.unregisterAppLoadedListener(this._boundOnAppLoaded);
        this.props.portalAppService.unregisterAppAboutToUnloadListener(this._boundOnAppUnload);

        this.props.messageBus.unsubscribe(ADD_PLUGIN_NAME_TITLE_MAPPING_TOPIC, this._boundOnPluginNameTitleMappingMessage);
        this.props.messageBus.unsubscribe(ADD_APP_ID_TITLE_MAPPING_TOPIC, this._boundOnAppIdTitleMappingMessage);
        this.props.messageBus.unsubscribe(FOCUS_APP_TOPIC, this._boundOnFocusAppMessage);
    }

    onPluginNameTitleMappingMessage(message: Message): void {
        if (message && message.pluginName && message.title) {
            this.setState({
                pluginNameTitleMapping: { ...this.state.pluginNameTitleMapping, [message.pluginName]: message.title,}
            });
        }
    }

    onAppIdTitleMappingMessage(message: Message): void {
        if (message && message.appId && message.title) {
            this.setState({
                appIdTitleMapping: { ...this.state.appIdTitleMapping, [message.appId]: message.title,}
            });
        }
    }

    onFocusAppMessage(message: Message): void {
        if (message && message.appId) {
            this.state.tabs.forEach((tab, idx) => {
                if (tab.app.id === message.appId) {
                    this.onChangeActiveTab(idx);
                }
            });
        }
    }

    onCloseApp(app: MashroomPortalLoadedPortalApp): void {
        this.props.portalAppService.unloadApp(app.id);
    }

    onAppLoaded(app: MashroomPortalLoadedPortalApp): void {
        if (app.pluginName !== this.props.tabifyPluginName && app.portalAppAreaId === this._areaId) {
            const existingAreaApp = this.state.tabs.find((tab) => tab.app.id === app.id);
            if (!existingAreaApp) {
                const wrapper = this.createAppWrapper(app);
                wrapper.style.display = 'none';
                const tab = {
                    wrapper,
                    app
                };

                let tabIdx = 0;
                this.props.portalAppService.loadedPortalApps
                    .filter((a) => a.pluginName !== this.props.tabifyPluginName && a.portalAppAreaId === this._areaId)
                    .forEach((a, idx) => {
                       if (a.id === app.id) {
                           tabIdx = idx;
                       }
                    });
                const tabs = [...this.state.tabs.slice(0, tabIdx), tab, ...this.state.tabs.slice(tabIdx)];

                this.setState({
                    tabs
                }, () => {
                    // The added app could be the first or could have the same index as the currently active,
                    // to simplify things, just switch to the newly added app
                    setTimeout(() => {
                        this.onChangeActiveTab(tabIdx);
                    }, 0);
                });
            }
        }
    }

    onAppUnload(app: MashroomPortalLoadedPortalApp): void {
        if (app.portalAppHostElement === this.props.hostElement) {
            console.info('Tabify app unloaded, removing all app wrappers');
            this.removeAllAppWrappers();
            return;
        }

        const currentTab = typeof(this.state.activeTabIndex) === 'number' && this.state.tabs[this.state.activeTabIndex];
        const unloadedTab = this.state.tabs.find((tab) => tab.app.id === app.id);
        if (unloadedTab) {
            console.info(`App ${app.pluginName} unloaded removing all app wrappers`);
            this.removeAppWrapper(unloadedTab);

            const remainingTabs = this.state.tabs.filter((tab) => tab.app.id !== app.id);
            this.setState({
                tabs: remainingTabs,
            });

            if (remainingTabs.length === 0) {
                this.setState({
                    activeTabIndex: null,
                });
            } else if (currentTab) {
                let newTabIndex = remainingTabs.indexOf(currentTab);
                if (newTabIndex !== this.state.activeTabIndex) {
                    if (newTabIndex === -1) {
                        newTabIndex = 0;
                    }
                    setTimeout(() => {
                        this.onChangeActiveTab(newTabIndex);
                    }, 100);
                }
            }
        }
    }

    onChangeActiveTab(newTabIndex: number): void {
        // Hide current active
        if (typeof(this.state.activeTabIndex) === 'number' && this.state.tabs.length > this.state.activeTabIndex) {
            const wrapperElem =  this.state.tabs[this.state.activeTabIndex].wrapper;
            wrapperElem.style.display = 'none';
        }

        // Show active tab
        if (this.state.tabs.length > newTabIndex) {
            const tabifyWrapperElem = this.state.tabs[newTabIndex].wrapper;
            tabifyWrapperElem.style.display = 'block';

            this.setState({
                activeTabIndex: newTabIndex,
            });

            setTimeout(() => {
                this.focusFirstInputOnActiveTab();
            },50);
        }
    }

    focusFirstInputOnActiveTab(): void {
        if (typeof(this.state.activeTabIndex) === 'number' && this.state.tabs.length > this.state.activeTabIndex) {
            const appWrapper = this.state.tabs[this.state.activeTabIndex].app.portalAppWrapperElement;
            if (appWrapper.id) {
                const firstInput = document.querySelector(`#${appWrapper.id} input`) as HTMLInputElement;
                if (firstInput) {
                    console.info('Focusing first input: ', firstInput);
                    firstInput.focus();
                }
            }
        }
    }

    renderTabHeader(): ReactNode {
        if (this.state.tabs.length === 0) {
            return null;
        }

        const fixedTabTitles = this.props.appConfig.fixedTabTitles || [];
        const buttons = this.state.tabs.map((tab, idx) => {
            let title;
            if (fixedTabTitles.length > idx) {
                title = fixedTabTitles[idx];
            }
            if (!title) {
                title = this.state.appIdTitleMapping[tab.app.id] || this.state.pluginNameTitleMapping[tab.app.pluginName] || tab.app.title || tab.app.pluginName;
            }

            return (
                <div key={tab.app.instanceId} className={`tab-dialog-button ${idx === this.state.activeTabIndex ? 'active' : ''}`} data-app-ref={`portal-app-${tab.app.id}`}>
                    <div className='title' onClick={this.onChangeActiveTab.bind(this, idx)}>{title}</div>
                    {this.props.appConfig.addCloseButtons && <div className='close-button' onClick={this.onCloseApp.bind(this, tab.app)}/>}
                </div>
            );
        });

        return (
            <div className='tab-dialog-header'>
                {buttons}
            </div>
        );
    }

    render(): ReactNode {
        return (
            <div className='mashroom-portal-tabify-app'>
                <div className='mashroom-portal-ui-tab-dialog'>
                    {this.renderTabHeader()}
                </div>
            </div>
        );
    }

}
