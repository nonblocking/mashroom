// @flow

import React, {PureComponent} from 'react';

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

type Props = {
    tabifyPluginName: string,
    hostElement: HTMLElement,
    appConfig: {
        addCloseButtons: boolean,
        pluginNameTitleMapping: {[string]: string},
    },
    messageBus: MashroomPortalMessageBus,
    portalAppService: MashroomPortalAppService
}

type State = {
    activeTabIndex: ?number,
    pluginNameTitleMapping: {[string]: string},
    appIdTitleMapping: {[string]: string},
    tabs: Array<Tab>
}

const ADD_PLUGIN_NAME_TITLE_MAPPING_TOPIC = 'tabify-add-plugin-name-title-mapping';
const ADD_APP_ID_TITLE_MAPPING_TOPIC = 'tabify-add-app-id-title-mapping';
const FOCUS_APP_TOPIC = 'tabify-focus-app';

export default class App extends PureComponent<Props, State> {

    areaId: string;
    boundOnAppLoaded: MashroomPortalAppLoadListener;
    boundOnAppUnload: MashroomPortalAppLoadListener;
    boundOnPluginNameTitleMappingMessage: MashroomPortalMessageBusSubscriberCallback;
    boundOnAppIdTitleMappingMessage: MashroomPortalMessageBusSubscriberCallback;
    boundOnFocusAppMessage: MashroomPortalMessageBusSubscriberCallback;

    constructor() {
        super();
        this.state = {
            activeTabIndex: null,
            pluginNameTitleMapping: {},
            appIdTitleMapping: {},
            tabs: [],
        };

        this.boundOnAppLoaded = this.onAppLoaded.bind(this);
        this.boundOnAppUnload = this.onAppUnload.bind(this);
        this.boundOnPluginNameTitleMappingMessage = this.onPluginNameTitleMappingMessage.bind(this);
        this.boundOnAppIdTitleMappingMessage = this.onAppIdTitleMappingMessage.bind(this);
        this.boundOnFocusAppMessage = this.onFocusAppMessage.bind(this);
    }

    createAppWrapper(app: MashroomPortalLoadedPortalApp): HTMLElement {
        // Hide the app header
        app.portalAppWrapperElement.classList.add('hide-header');

        // Find the outermost wrapper
        let currentWrapper: HTMLElement = app.portalAppWrapperElement;
        while (currentWrapper.parentElement && currentWrapper.parentElement.id !== app.portalAppAreaId) {
            currentWrapper = (currentWrapper.parentElement: any);
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

    removeAppWrapper(tab: Tab) {
        const previousWrapper = tab.wrapper.firstChild;
        const appAreaElement = tab.wrapper.parentElement;
        if (previousWrapper && appAreaElement) {
            appAreaElement.insertBefore(previousWrapper, tab.wrapper);
            appAreaElement.removeChild(tab.wrapper);
        }
        tab.app.portalAppWrapperElement.classList.remove('hide-header');
    }

    removeAllAppWrappers() {
        this.state.tabs.forEach((tab) => {
            this.removeAppWrapper(tab);
        });
    }

    componentDidMount() {
        const tabifyApp = this.props.portalAppService.loadedPortalApps.find((app) => app.portalAppHostElement === this.props.hostElement);
        if (tabifyApp) {
            tabifyApp.portalAppWrapperElement.classList.add('no-border');
            tabifyApp.portalAppWrapperElement.classList.add('no-margin');
            tabifyApp.portalAppWrapperElement.classList.add('hide-header');

            this.areaId = tabifyApp.portalAppAreaId;
            const areaApps = this.props.portalAppService.loadedPortalApps.filter((app) => app.pluginName !== this.props.tabifyPluginName && app.portalAppAreaId === this.areaId);
            const tabs = [];

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
                pluginNameTitleMapping: this.props.appConfig.pluginNameTitleMapping,
                tabs
            });

            setTimeout(() => {
                this.focusFirstInputOnActiveTab();
            },50);

            this.props.portalAppService.registerAppLoadedListener(this.boundOnAppLoaded);
            this.props.portalAppService.registerAppAboutToUnloadListener(this.boundOnAppUnload);

            this.props.messageBus.subscribe(ADD_PLUGIN_NAME_TITLE_MAPPING_TOPIC, this.boundOnPluginNameTitleMappingMessage);
            this.props.messageBus.subscribe(ADD_APP_ID_TITLE_MAPPING_TOPIC, this.boundOnAppIdTitleMappingMessage);
            this.props.messageBus.subscribe(FOCUS_APP_TOPIC, this.boundOnFocusAppMessage);
        }
    }

    componentWillUnmount() {
        this.props.portalAppService.unregisterAppLoadedListener(this.boundOnAppLoaded);
        this.props.portalAppService.unregisterAppAboutToUnloadListener(this.boundOnAppUnload);

        this.props.messageBus.unsubscribe(ADD_PLUGIN_NAME_TITLE_MAPPING_TOPIC, this.boundOnPluginNameTitleMappingMessage);
        this.props.messageBus.unsubscribe(ADD_APP_ID_TITLE_MAPPING_TOPIC, this.boundOnAppIdTitleMappingMessage);
        this.props.messageBus.unsubscribe(FOCUS_APP_TOPIC, this.boundOnFocusAppMessage);
    }

    onPluginNameTitleMappingMessage(message: any) {
        if (message && message.pluginName && message.title) {
            this.setState({
                pluginNameTitleMapping: Object.assign({}, this.state.pluginNameTitleMapping, {
                    [message.pluginName]: message.title,
                })
            });
        }
    }

    onAppIdTitleMappingMessage(message: any) {
        if (message && message.appId && message.title) {
            this.setState({
                appIdTitleMapping: Object.assign({}, this.state.appIdTitleMapping, {
                    [message.appId]: message.title,
                })
            });
        }
    }

    onFocusAppMessage(message: any) {
        if (message && message.appId) {
            this.state.tabs.forEach((tab, idx) => {
                if (tab.app.id === message.appId) {
                    this.onChangeActiveTab(idx);
                }
            });
        }
    }

    onCloseApp(app: MashroomPortalLoadedPortalApp) {
        this.props.portalAppService.unloadApp(app.id);
    }

    onAppLoaded(app: MashroomPortalLoadedPortalApp) {
        if (app.pluginName !== this.props.tabifyPluginName && app.portalAppAreaId === this.areaId) {
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
                    .filter((a) => a.pluginName !== this.props.tabifyPluginName && a.portalAppAreaId === this.areaId)
                    .forEach((a, idx) => {
                       if (a.id === app.id) {
                           tabIdx = idx;
                       }
                    });
                const tabs = [...this.state.tabs.slice(0, tabIdx), tab, ...this.state.tabs.slice(tabIdx)];

                this.setState({
                    tabs
                });

                // The added app could be the first or could have the same index as the currently active,
                // to simplify things, just switch to the newly added app
                setTimeout(() => {
                    this.onChangeActiveTab(tabIdx);
                }, 0);
            }
        }
    }

    onAppUnload(app: MashroomPortalLoadedPortalApp) {
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
            } else {
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

    onChangeActiveTab(newTabIndex: number) {
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

    focusFirstInputOnActiveTab() {
        if (typeof(this.state.activeTabIndex) === 'number' && this.state.tabs.length > this.state.activeTabIndex) {
            const appWrapper = this.state.tabs[this.state.activeTabIndex].app.portalAppWrapperElement;
            if (appWrapper.id) {
                const firstInput = document.querySelector(`#${appWrapper.id} input`);
                if (firstInput) {
                    console.info('Focusing first input: ', firstInput);
                    firstInput.focus();
                }
            }
        }
    }

    renderTabHeader() {
        if (this.state.tabs.length === 0) {
            return null;
        }

        const buttons = this.state.tabs.map((tab, idx) => {
            const title = this.state.appIdTitleMapping[tab.app.id] || this.state.pluginNameTitleMapping[tab.app.pluginName] || tab.app.title || tab.app.pluginName;

            return (
                <div key={tab.app.instanceId} className={`tab-dialog-button ${idx === this.state.activeTabIndex ? 'active' : ''}`}>
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

    render() {
        return (
            <div className='mashroom-portal-tabify-app'>
                <div className='mashroom-portal-ui-tab-dialog'>
                    {this.renderTabHeader()}
                </div>
            </div>
        );
    }

}
