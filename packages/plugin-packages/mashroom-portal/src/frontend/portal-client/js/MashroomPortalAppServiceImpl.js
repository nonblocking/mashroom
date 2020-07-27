// @flow

import {
    WINDOW_VAR_PORTAL_API_PATH,
    WINDOW_VAR_PORTAL_CUSTOM_CREATE_APP_WRAPPER_FUNC,
    WINDOW_VAR_PORTAL_CUSTOM_CREATE_LOADING_ERROR_FUNC,
    WINDOW_VAR_PORTAL_DEV_MODE,
    WINDOW_VAR_PORTAL_PAGE_ID,
    WINDOW_VAR_PORTAL_SERVICES,
} from '../../../backend/constants';
import ResourceManager from './ResourceManager';
import defaultCreateAppWrapper from './default_create_app_wrapper';
import defaultCreateLoadingError from './default_create_loading_error';

import type {
    MashroomAvailablePortalApp,
    MashroomPortalAppLifecycleHooks,
    MashroomPortalAppLoadListener,
    MashroomPortalAppPluginBootstrapFunction,
    MashroomPortalAppService,
    MashroomPortalAppSetup,
    MashroomPortalClientServices,
    MashroomPortalLoadedPortalApp,
    MashroomPortalMasterMessageBus,
    MashroomPortalRemoteLogger,
    MashroomRestService,
    ModalAppCloseCallback,
} from '../../../../type-definitions';

export type LoadedPortalAppInternal = {
    id: string,
    pluginName: string,
    instanceId: ?string,
    title: ?string,
    appSetup: ?MashroomPortalAppSetup,
    loadedTs: number,
    portalAppAreaId: string,
    portalAppWrapperElement: HTMLDivElement,
    portalAppHostElement: HTMLDivElement,
    portalAppTitleElement: HTMLDivElement,
    lifecycleHooks: ?MashroomPortalAppLifecycleHooks,
    modal: boolean,
    error: boolean
}

const HOST_ELEMENT_MODAL_OVERLAY = 'mashroom-portal-modal-overlay-app';
const MODAL_OVERLAY_ID = 'mashroom-portal-modal-overlay';
const MODAL_OVERLAY_CLOSE_BUTTON_ID = 'mashroom-portal-modal-overlay-close';
const MODAL_OVERLAY_TITLE_ID = 'mashroom-portal-modal-overlay-title';
const APP_INFO_CLASS_NAME = 'mashroom-portal-app-info';

const APP_UPDATE_CHECK_INTERVAL = 3000;

export const loadedPortalAppsInternal: Array<LoadedPortalAppInternal> = [];

export default class MashroomPortalAppServiceImpl implements MashroomPortalAppService {

    _restService: MashroomRestService;
    _remoteLogger: MashroomPortalRemoteLogger;
    _resourceManager: ResourceManager;
    _loadListeners: Array<MashroomPortalAppLoadListener>;
    _aboutToUnloadListeners: Array<MashroomPortalAppLoadListener>;
    _lastId: number;
    _watch: boolean;
    _watchedApps: Array<LoadedPortalAppInternal>;
    _watchTimer: ?any;
    _lastUpdatedCheckTs: number;

    constructor(restService: MashroomRestService, resourceManager: ResourceManager, remoteLogger: MashroomPortalRemoteLogger) {
        const apiPath = global[WINDOW_VAR_PORTAL_API_PATH];
        console.debug('Using portal api path:', apiPath);
        this._restService = restService.withBasePath(apiPath);
        this._resourceManager = resourceManager;
        this._remoteLogger = remoteLogger;
        this._loadListeners = [];
        this._aboutToUnloadListeners = [];
        this._lastId = 1000;
        this._watch = !!global[WINDOW_VAR_PORTAL_DEV_MODE];
        this._watchedApps = [];
        this._watchTimer = null;
        this._lastUpdatedCheckTs = Date.now();
    }

    getAvailableApps() {
        const path = `/portal-apps`;
        return this._restService.get(path);
    }

    loadApp(hostElementId: string, pluginName: string, instanceId: ?string, position?: ?number, overrideAppConfig?: ?Object) {
        if (instanceId && this._findLoadedPortalApps(pluginName, instanceId).length > 0) {
            return Promise.reject(`App ${pluginName}' with instance id ${instanceId} is already loaded!`);
        }

        console.info(`Loading app '${pluginName}' with instance id: ${instanceId || '<undefined>'}`);

        return this._loadApp(hostElementId, pluginName, instanceId, false, position, overrideAppConfig).then(
            (loadedApp) => {
                if (this._watch) {
                    this._startCheckForAppUpdates(loadedApp);
                }
                return this._toLoadedApp(loadedApp);
            }
        );
    }

    loadAppModal(pluginName: string, title?: ?string, overrideAppConfig?: ?Object, onClose?: ?ModalAppCloseCallback) {
        console.info(`Loading app '${pluginName}' modal`);

        return this._loadApp(HOST_ELEMENT_MODAL_OVERLAY, pluginName, null, true, null, overrideAppConfig).then(
            (loadedApp) => {
                this._showModalOverlay(loadedApp, title, onClose);

                if (this._watch) {
                    this._startCheckForAppUpdates(loadedApp);
                }

                return this._toLoadedApp(loadedApp);
            }
        );
    }

    reloadApp(id: string, overrideAppConfig?: ?Object) {
        const loadedAppInternal = this._findLoadedApp(id);
        if (!loadedAppInternal) {
            return Promise.reject(`No app found with id: ${id}`);
        }

        console.info(`Reloading app '${loadedAppInternal.pluginName}' with id: ${id}`);

        this._fireAboutToUnloadEvent(loadedAppInternal);

        this._resourceManager.unloadAppResources(loadedAppInternal);
        const {portalAppWrapperElement, portalAppHostElement, portalAppTitleElement} =
            this._createAppWrapper(loadedAppInternal.id, loadedAppInternal.pluginName, loadedAppInternal.instanceId);
        const parent = loadedAppInternal.portalAppWrapperElement.parentElement;
        if (parent) {
            parent.replaceChild(portalAppWrapperElement, loadedAppInternal.portalAppWrapperElement);
        }
        loadedAppInternal.portalAppWrapperElement = portalAppWrapperElement;
        loadedAppInternal.portalAppHostElement = portalAppHostElement;
        loadedAppInternal.portalAppTitleElement = portalAppTitleElement;
        loadedAppInternal.loadedTs = Date.now();

        return this._loadAppSetupAndStart(loadedAppInternal, overrideAppConfig).then(
            () => {
                return this._toLoadedApp(loadedAppInternal);
            }
        );
    }

    unloadApp(id: string) {
        const loadedAppInternal = this._findLoadedApp(id);
        if (!loadedAppInternal) {
            console.error(`No app found with id: ${id}`);
            return;
        }

        console.info(`Unloading app '${loadedAppInternal.pluginName}' with id: ${id}`);
        this._fireAboutToUnloadEvent(loadedAppInternal);

        const removeHostElemAndUnloadResources = () => {
            const parent = loadedAppInternal.portalAppWrapperElement.parentElement;
            if (parent) {
                parent.removeChild(loadedAppInternal.portalAppWrapperElement);
            }

            this._unsubscribeFromMessageBus(loadedAppInternal);
            this._stopCheckForAppUpdates(loadedAppInternal);
            this._resourceManager.unloadAppResources(loadedAppInternal);

            const idx = loadedPortalAppsInternal.indexOf(loadedAppInternal);
            loadedPortalAppsInternal.splice(idx, 1);

            if (loadedAppInternal.modal) {
                const modalOverlayElem = document.getElementById(MODAL_OVERLAY_ID);
                if (modalOverlayElem) {
                    modalOverlayElem.classList.remove('show');
                }
            }
        };

        const handleError = (error) => {
            console.warn(`Calling willBeRemoved callback of app '${loadedAppInternal.pluginName}' failed`, error);
            this._remoteLogger.warn('Calling willBeRemoved callback failed', error, loadedAppInternal.pluginName);
            removeHostElemAndUnloadResources();
        };

        if (loadedAppInternal.lifecycleHooks && loadedAppInternal.lifecycleHooks.willBeRemoved) {
            try {
                const promise = loadedAppInternal.lifecycleHooks.willBeRemoved();
                if (promise && promise.then) {
                    promise.then(
                        () => {
                            removeHostElemAndUnloadResources();
                        },
                        (error) => {
                            handleError(error);
                        }
                    ).catch((error) => {
                        handleError(error);
                    });
                } else {
                    removeHostElemAndUnloadResources();
                }
            } catch (error) {
                handleError(error);
            }
        } else {
            removeHostElemAndUnloadResources();
        }
    }

    moveApp(id: string, newAppAreaId: string, newPosition?: number) {
        const loadedAppInternal = this._findLoadedApp(id);
        if (!loadedAppInternal) {
            console.error(`No app found with id: ${id}`);
            return;
        }

        this._fireAboutToUnloadEvent(loadedAppInternal);
        this._insertPortalAppIntoDOM(loadedAppInternal.portalAppWrapperElement, newAppAreaId, newPosition);
        this._fireLoadEvent(loadedAppInternal);
    }

    showAppInfos(customize?: (portalApp: MashroomPortalLoadedPortalApp, overlay: HTMLDivElement) => void) {
        const showInfo = (portalApp: MashroomPortalLoadedPortalApp) => {
            portalApp.portalAppWrapperElement.style.position = 'relative';
            const appInfoElem = document.createElement('div');
            appInfoElem.className = APP_INFO_CLASS_NAME;
            appInfoElem.style.position = 'absolute';
            appInfoElem.innerHTML = `
                <div class="portal-app-name">${portalApp.pluginName}</div>
                <div class="portal-app-version">${portalApp.version || '<unknown>'}</div>
            `;
            if (customize) {
                customize(portalApp, appInfoElem);
            }
            portalApp.portalAppWrapperElement.appendChild(appInfoElem);
        };

        this.loadedPortalApps.forEach((portalApp) => showInfo(portalApp));
    }

    hideAppInfos() {
        const overlays = document.querySelectorAll(`.${APP_INFO_CLASS_NAME}`);
        for (let i = 0; i < overlays.length; ++i) {
            const overlay = overlays[i];
            overlay.parentElement && overlay.parentElement.removeChild(overlay);
        }
    }

    registerAppLoadedListener(listener: MashroomPortalAppLoadListener) {
        this._loadListeners.push(listener);
    }

    unregisterAppLoadedListener(listener: MashroomPortalAppLoadListener) {
        this._loadListeners = this._loadListeners.filter((l) => l !== listener);
    }

    registerAppAboutToUnloadListener(listener: MashroomPortalAppLoadListener) {
        this._aboutToUnloadListeners.push(listener);
    }

    unregisterAppAboutToUnloadListener(listener: MashroomPortalAppLoadListener) {
        this._aboutToUnloadListeners = this._aboutToUnloadListeners.filter((l) => l !== listener);
    }

    loadAppSetup(pluginName: string, instanceId: ?string): Promise<MashroomPortalAppSetup> {
        const pageId = this._getPageId();
        return this._loadAppSetup(pageId, pluginName, instanceId);
    }

    get loadedPortalApps(): Array<MashroomPortalLoadedPortalApp> {
        return loadedPortalAppsInternal.map((loadedAppInternal) => this._toLoadedApp(loadedAppInternal));
    }

    _loadApp(portalAppAreaId: string, pluginName: string, instanceId: ?string, modal: boolean, position?: ?number, overrideAppConfig?: ?Object): Promise<LoadedPortalAppInternal> {

        const id = String(this._lastId++);
        const {portalAppWrapperElement, portalAppHostElement, portalAppTitleElement} = this._appendAppWrapper(id, pluginName, instanceId, portalAppAreaId, position);
        const loadedAppInternal: LoadedPortalAppInternal = {
            id,
            pluginName,
            instanceId,
            title: null,
            loadedTs: Date.now(),
            appSetup: null,
            portalAppAreaId,
            portalAppWrapperElement,
            portalAppHostElement,
            portalAppTitleElement,
            addedScripts: [],
            addedStyles: [],
            lifecycleHooks: null,
            modal,
            error: false
        };
        loadedPortalAppsInternal.push(loadedAppInternal);

        return this._loadAppSetupAndStart(loadedAppInternal, overrideAppConfig).then(
            () => {
                return loadedAppInternal;
            }
        );
    }

    _loadAppSetupAndStart(loadedPortalAppInternal: LoadedPortalAppInternal, overrideAppConfig?: ?Object): Promise<void> {
        const pageId = this._getPageId();

        return this._loadAppSetup(pageId, loadedPortalAppInternal.pluginName, loadedPortalAppInternal.instanceId).then(
            (appSetup: MashroomPortalAppSetup) => {
                if (overrideAppConfig) {
                    const existingAppConfig = loadedPortalAppInternal.appSetup && loadedPortalAppInternal.appSetup.appConfig || {};
                    appSetup = {
                        ...appSetup,
                        appConfig: {...appSetup.appConfig, ...existingAppConfig, ...overrideAppConfig}
                    };
                }
                loadedPortalAppInternal.appSetup = appSetup;
                loadedPortalAppInternal.instanceId = appSetup.instanceId;
                loadedPortalAppInternal.title = appSetup.title;
                if (appSetup.title) {
                    loadedPortalAppInternal.portalAppTitleElement.innerHTML = appSetup.title;
                }
                this._fireLoadEvent(loadedPortalAppInternal);

                return this._loadResources(loadedPortalAppInternal).then(
                    () => {
                        console.info(`Starting portal app '${loadedPortalAppInternal.pluginName}' with setup: `, appSetup);
                        return this._startApp(loadedPortalAppInternal.id, loadedPortalAppInternal.portalAppHostElement, appSetup, loadedPortalAppInternal.pluginName).then(
                            (lifecycleHooks: ?MashroomPortalAppLifecycleHooks) => {
                                loadedPortalAppInternal.lifecycleHooks = lifecycleHooks;
                            }
                        );
                    }
                )
            }
        ).catch((error) => {
            this._showLoadingError(loadedPortalAppInternal);
            console.error('Loading app setup failed!', error);
            loadedPortalAppInternal.error = true;
            this._fireLoadEvent(loadedPortalAppInternal);
            return Promise.resolve();
        });
    }

    _loadAppSetup(pageId: string, pluginName: string, instanceId: ?string): Promise<MashroomPortalAppSetup> {
        const path = `/pages/${pageId}/portal-app-instances/${pluginName}${instanceId ? `/${instanceId}` : ''}`;
        return this._restService.get(path);
    }

    _loadResources(loadedPortalApp: LoadedPortalAppInternal): Promise<any> {
        const appSetup = loadedPortalApp.appSetup;
        if (!appSetup) {
            return Promise.reject('appSetup not loaded');
        }

        // JavaScript
        const sharedJSResourcesPromises: Array<Promise<void>> = [];
        if (appSetup.sharedResources && appSetup.sharedResources.js) {
            appSetup.sharedResources.js.forEach((jsResource) =>
                sharedJSResourcesPromises.push(
                    this._resourceManager.loadJs(`${appSetup.sharedResourcesBasePath}/js/${jsResource}`, loadedPortalApp))
            );
        }
        const jsPromises = Promise.all(sharedJSResourcesPromises).then(() => {
            const jsResourcesPromises: Array<Promise<void>> = [];
            if (appSetup.resources.js) {
                appSetup.resources.js.forEach((jsResource) =>
                    jsResourcesPromises.push(
                        this._resourceManager.loadJs(`${appSetup.resourcesBasePath}/${jsResource}?v=${appSetup.lastReloadTs}`, loadedPortalApp))
                );
            }
            return Promise.all(jsResourcesPromises);
        });

        // CSS
        // We don't have to wait for CSS resources before we can start the app
        if (appSetup.sharedResources && appSetup.sharedResources.css) {
            appSetup.sharedResources.css.forEach((cssResource) =>
                this._resourceManager.loadStyle(`${appSetup.sharedResourcesBasePath}/css/x${cssResource}`, loadedPortalApp));
        }
        if (appSetup.resources.css) {
            appSetup.resources.css.forEach((cssResource) =>
                this._resourceManager.loadStyle(`${appSetup.resourcesBasePath}/${cssResource}?v=${appSetup.lastReloadTs}`, loadedPortalApp));
        }

        return jsPromises;
    }

    _startApp(appId: string, wrapper: HTMLElement, appSetup: MashroomPortalAppSetup, pluginName: string): Promise<?MashroomPortalAppLifecycleHooks> {
        const bootstrap: MashroomPortalAppPluginBootstrapFunction = global[appSetup.globalLaunchFunction];
        if (!bootstrap) {
            return Promise.reject(`App bootstrap function not found: ${appSetup.globalLaunchFunction}`);
        }

        const clientServices: MashroomPortalClientServices = global[WINDOW_VAR_PORTAL_SERVICES];
        const clonedServices = Object.freeze({
            ...clientServices, messageBus: this._getMasterMessageBus(clientServices).getAppInstance(appId),
            remoteLogger: clientServices.remoteLogger.getAppInstance(pluginName)
        });

        const handleError = (error) => {
            console.error(`Error in bootstrap of app: ${pluginName}`, error);
            this._remoteLogger.error('Error during bootstrap execution', error, pluginName);
        };

        let bootstrapRetVal = null;
        try {
            bootstrapRetVal = bootstrap(wrapper, appSetup, clonedServices);
        } catch (error) {
            handleError(error);
            return Promise.reject(error);
        }

        if (bootstrapRetVal) {
            if (typeof (bootstrapRetVal.then) === 'function') {
                const promise: Promise<void | MashroomPortalAppLifecycleHooks> = (bootstrapRetVal: any);
                return promise.then(
                    (lifecycleMethods: void | MashroomPortalAppLifecycleHooks) => {
                        console.info(`App successfully loaded: ${pluginName}`);
                        return lifecycleMethods;
                    }
                ).catch((error) => {
                    handleError(error);
                    return Promise.reject(error);
                });
            } else {
                console.info(`App successfully loaded: ${pluginName}`);
                const lifecycleHooks: MashroomPortalAppLifecycleHooks = (bootstrapRetVal: any);
                return Promise.resolve(lifecycleHooks);
            }
        } else {
            console.info(`App successfully loaded: ${pluginName}`);
        }

        return Promise.resolve();
    }

    _showModalOverlay(loadedApp: LoadedPortalAppInternal, title?: ?string, onClose: ?ModalAppCloseCallback) {
        // Show overlay
        const modalOverlayElem = document.getElementById(MODAL_OVERLAY_ID);
        if (modalOverlayElem) {
            modalOverlayElem.classList.add('show');
            const modalOverlayTitleElem = document.getElementById(MODAL_OVERLAY_TITLE_ID);
            const modalOverlayCloseButtonElem = document.getElementById(MODAL_OVERLAY_CLOSE_BUTTON_ID);
            if (modalOverlayTitleElem) {
                modalOverlayTitleElem.innerHTML = title || loadedApp.title || loadedApp.pluginName;
            }

            // Hide app header
            loadedApp.portalAppWrapperElement.classList.add('hide-header');

            const hideDialog = () => modalOverlayElem.classList.remove('show');
            const unloadApp = () => this.unloadApp(loadedApp.id);

            /* eslint no-use-before-define: off */
            const keyEventListener = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    closeEventListener();
                }
            };
            const closeEventListener = () => {
                if (onClose) {
                    onClose(modalOverlayElem, hideDialog, unloadApp);
                } else {
                    hideDialog();
                    unloadApp();
                }
                if (modalOverlayCloseButtonElem) {
                    modalOverlayCloseButtonElem.removeEventListener('click', closeEventListener);
                }
                document.removeEventListener('keyup', keyEventListener);
            };
            if (modalOverlayCloseButtonElem) {
                modalOverlayCloseButtonElem.addEventListener('click', closeEventListener);
            }
            document.addEventListener('keyup', keyEventListener);

        } else {
            console.error('Cannot show modal overlay because element not found: ', MODAL_OVERLAY_ID);
        }
    }

    _appendAppWrapper(id: string, pluginName: string, instanceId: ?string, portalAppAreaId: string, position?: ?number) {
        console.log(`Adding wrapper for app: ${pluginName}, host element: ${portalAppAreaId}, position: ${String(position)}`);

        const {portalAppWrapperElement, portalAppHostElement, portalAppTitleElement} = this._createAppWrapper(id, pluginName, instanceId);

        this._insertPortalAppIntoDOM(portalAppWrapperElement, portalAppAreaId, position);

        return {portalAppWrapperElement, portalAppHostElement, portalAppTitleElement};
    }

    _insertPortalAppIntoDOM(portalAppWrapperElement: HTMLDivElement, portalAppAreaId: string, position?: ?number) {
        let inserted = false;

        let parentElem = document.getElementById(portalAppAreaId);
        if (!parentElem) {
            console.error(`App Area ID not found: ${portalAppAreaId} - attaching app to body!`);
            parentElem = document.body;
        }

        if (parentElem) {
            if (typeof (position) === 'number') {
                position = Math.max(0, position);
                if (position < parentElem.children.length) {
                    parentElem.insertBefore(portalAppWrapperElement, parentElem.children[position]);
                    inserted = true;
                }
            }

            if (!inserted) {
                parentElem.appendChild(portalAppWrapperElement);
            }
        }
    }

    _createAppWrapper(id: string, pluginName: string, title: ?string) {
        const createAppWrapper = global[WINDOW_VAR_PORTAL_CUSTOM_CREATE_APP_WRAPPER_FUNC] || defaultCreateAppWrapper;
        return createAppWrapper(id, pluginName, title);
    }

    _showLoadingError(portalApp: LoadedPortalAppInternal) {
        const createLoadingError = global[WINDOW_VAR_PORTAL_CUSTOM_CREATE_LOADING_ERROR_FUNC] || defaultCreateLoadingError;
        const errorElement = createLoadingError(portalApp.id, portalApp.pluginName, portalApp.title);

        portalApp.portalAppHostElement.innerHTML = '';
        portalApp.portalAppHostElement.appendChild(errorElement);
    }

    _findLoadedPortalApps(pluginName: string, instanceId: ?string) {
        const loadedApps = [];

        loadedPortalAppsInternal.forEach((loadedApp) => {
            if (loadedApp.pluginName === pluginName) {
                if (!instanceId || loadedApp.instanceId === instanceId) {
                    loadedApps.push(loadedApp);
                }
            }
        });

        return loadedApps;
    }

    _findLoadedApp(id: string) {
        return loadedPortalAppsInternal.find((app) => app.id === id);
    }

    _getMasterMessageBus(clientServices: MashroomPortalClientServices): MashroomPortalMasterMessageBus {
        const mmb: MashroomPortalMasterMessageBus = (clientServices.messageBus: any);
        return mmb;
    }

    _unsubscribeFromMessageBus(loadedAppInternal: LoadedPortalAppInternal): void {
        const clientServices: MashroomPortalClientServices = global[WINDOW_VAR_PORTAL_SERVICES];
        const mmb = this._getMasterMessageBus(clientServices);
        mmb.unsubscribeEverythingFromApp(loadedAppInternal.id);
    }

    _getPageId() {
        const pageId = window[WINDOW_VAR_PORTAL_PAGE_ID];
        if (!pageId) {
            throw new Error('Unable to determine the current pageId!');
        }
        return pageId;
    }

    _toLoadedApp(loadedAppInternal: LoadedPortalAppInternal): MashroomPortalLoadedPortalApp {
        return {
            id: loadedAppInternal.id,
            pluginName: loadedAppInternal.pluginName,
            title: loadedAppInternal.title,
            version: loadedAppInternal.appSetup && loadedAppInternal.appSetup.version,
            instanceId: loadedAppInternal.instanceId,
            portalAppAreaId: loadedAppInternal.portalAppAreaId,
            portalAppWrapperElement: loadedAppInternal.portalAppWrapperElement,
            portalAppHostElement: loadedAppInternal.portalAppHostElement,
            portalAppTitleElement: loadedAppInternal.portalAppTitleElement,
            appConfig: loadedAppInternal.appSetup && loadedAppInternal.appSetup.appConfig,
            error: loadedAppInternal.error
        };
    }

    _checkForAppUpdates() {
        // console.info('Checking for app updates since: ', this._lastUpdatedCheckTs);

        this._restService.get(`/portal-apps?updatedSince=${this._lastUpdatedCheckTs}`, {
            'x-mashroom-does-not-extend-auth': 1
        }).then(
            (updatedApps: Array<MashroomAvailablePortalApp>) => {
                if (Array.isArray(updatedApps) && updatedApps.length > 0) {
                    console.info('Updated apps found:', updatedApps);
                    let promise: ?Promise<any> = null;
                    updatedApps
                        .filter((app) => this._watchedApps.find((watchedApp) => watchedApp.pluginName === app.name))
                        .forEach((app) => {
                            console.info('Reloading all instances of app:', app.name);
                            this.loadedPortalApps
                                .filter((loadedApp) => loadedApp.pluginName === app.name)
                                .forEach((loadedApp) => {
                                    if (promise) {
                                        promise = promise.then(() => this.reloadApp(loadedApp.id));
                                    } else {
                                        promise = this.reloadApp(loadedApp.id);
                                    }
                                });
                        });
                    if (promise) {
                        promise.then(
                            () => {
                            },
                            (error) => {
                                console.error('Failed to update some apps', error);
                            }
                        )
                    }
                }
            }
        );

        this._lastUpdatedCheckTs = Date.now();
    }

    _startCheckForAppUpdates(loadedAppInternal: LoadedPortalAppInternal): void {
        // Remove existing
        this._stopCheckForAppUpdates(loadedAppInternal);

        this._watchedApps.push(loadedAppInternal);
        if (!this._watchTimer) {
            this._watchTimer = setInterval(this._checkForAppUpdates.bind(this), APP_UPDATE_CHECK_INTERVAL);
        }
    }

    _stopCheckForAppUpdates(loadedAppInternal: LoadedPortalAppInternal): void {
        this._watchedApps = this._watchedApps.filter((app) => app.id !== loadedAppInternal.id);
        if (this._watchedApps.length === 0 && this._watchTimer) {
            clearInterval(this._watchTimer);
            this._watchTimer = null;
        }
    }

    _fireLoadEvent(loadedAppInternal: LoadedPortalAppInternal) {
        const loadedApp = this._toLoadedApp(loadedAppInternal);
        try {
            this._loadListeners.forEach((l) => l(loadedApp));
        } catch (e) {
            this._remoteLogger.error('Load listener threw an error', e);
            console.error('Load listener threw an error: ', e);
        }
    }

    _fireAboutToUnloadEvent(loadedAppInternal: LoadedPortalAppInternal) {
        const loadedApp = this._toLoadedApp(loadedAppInternal);
        try {
            this._aboutToUnloadListeners.forEach((l) => l(loadedApp));
        } catch (e) {
            this._remoteLogger.error('AboutToUnload listener threw an error', e);
            console.error('AboutToUnload listener threw an error: ', e);
        }
    }
}
