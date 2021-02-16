
import {
    WINDOW_VAR_PORTAL_API_PATH,
    WINDOW_VAR_PORTAL_CUSTOM_CLIENT_SERVICES,
    WINDOW_VAR_PORTAL_CUSTOM_CREATE_APP_WRAPPER_FUNC,
    WINDOW_VAR_PORTAL_CUSTOM_CREATE_LOADING_ERROR_FUNC,
    WINDOW_VAR_PORTAL_DEV_MODE,
    WINDOW_VAR_PORTAL_PAGE_ID,
    WINDOW_VAR_PORTAL_PRELOADED_APP_SETUP,
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
    MashroomPortalMasterStateService,
    MashroomPortalMessageBus,
    MashroomPortalStateService,
    MashroomPortalRemoteLogger,
    MashroomRestService,
    ModalAppCloseCallback,
} from '../../../../type-definitions';
import type {MashroomPortalPluginType} from '../../../../type-definitions/internal';

export type LoadedPortalAppInternal = {
    id: string;
    pluginName: string;
    instanceId: string | undefined | null;
    title: string | undefined | null;
    appSetup: MashroomPortalAppSetup | undefined | null;
    loadedTs: number;
    portalAppAreaId: string;
    portalAppWrapperElement: HTMLDivElement;
    portalAppHostElement: HTMLDivElement;
    portalAppTitleElement: HTMLDivElement;
    lifecycleHooks: MashroomPortalAppLifecycleHooks | void;
    modal: boolean;
    error: boolean;
}

const HOST_ELEMENT_MODAL_OVERLAY = 'mashroom-portal-modal-overlay-app';
const MODAL_OVERLAY_ID = 'mashroom-portal-modal-overlay';
const MODAL_OVERLAY_CLOSE_BUTTON_ID = 'mashroom-portal-modal-overlay-close';
const MODAL_OVERLAY_TITLE_ID = 'mashroom-portal-modal-overlay-title';
const APP_INFO_CLASS_NAME = 'mashroom-portal-app-info';

const APP_UPDATE_CHECK_INTERVAL = 3000;

export const loadedPortalAppsInternal: Array<LoadedPortalAppInternal> = [];

export default class MashroomPortalAppServiceImpl implements MashroomPortalAppService {

    private restService: MashroomRestService;
    private loadListeners: Array<MashroomPortalAppLoadListener>;
    private aboutToUnloadListeners: Array<MashroomPortalAppLoadListener>;
    private lastId: number;
    private watch: boolean;
    private watchedApps: Array<LoadedPortalAppInternal>;
    private watchTimer: any | undefined | null;
    private lastUpdatedCheckTs: number;
    private appsUpdateEventSource: EventSource | undefined;

    constructor(restService: MashroomRestService, private resourceManager: ResourceManager, private remoteLogger: MashroomPortalRemoteLogger) {
        const apiPath = (global as any)[WINDOW_VAR_PORTAL_API_PATH];
        console.debug('Using portal api path:', apiPath);
        this.restService = restService.withBasePath(apiPath);
        this.loadListeners = [];
        this.aboutToUnloadListeners = [];
        this.lastId = 1000;
        this.watch = !!(global as any)[WINDOW_VAR_PORTAL_DEV_MODE];
        this.watchedApps = [];
        this.watchTimer = null;
        this.lastUpdatedCheckTs = Date.now();
    }

    getAvailableApps() {
        const path = `/portal-apps`;
        return this.restService.get(path);
    }

    loadApp(hostElementId: string, pluginName: string, instanceId: string | undefined | null, position?: number | undefined | null, overrideAppConfig?: any | undefined | null) {
        if (instanceId && this.findLoadedPortalApps(pluginName, instanceId).length > 0) {
            return Promise.reject(`App ${pluginName}' with instance id ${instanceId} is already loaded!`);
        }

        console.info(`Loading app '${pluginName}' with instance id: ${instanceId || '<undefined>'}`);

        return this.internalLoadApp(hostElementId, pluginName, instanceId, false, position, overrideAppConfig).then(
            (loadedApp) => {
                if (this.watch) {
                    this.startCheckForAppUpdates(loadedApp);
                }
                return this.toLoadedApp(loadedApp);
            }
        );
    }

    loadAppModal(pluginName: string, title?: string | undefined | null, overrideAppConfig?: any | undefined | null, onClose?: ModalAppCloseCallback | undefined | null) {
        console.info(`Loading app '${pluginName}' modal`);

        return this.internalLoadApp(HOST_ELEMENT_MODAL_OVERLAY, pluginName, null, true, null, overrideAppConfig).then(
            (loadedApp) => {
                this.showModalOverlay(loadedApp, title, onClose);

                if (this.watch) {
                    this.startCheckForAppUpdates(loadedApp);
                }

                return this.toLoadedApp(loadedApp);
            }
        );
    }

    reloadApp(id: string, overrideAppConfig?: any | undefined | null) {
        const loadedAppInternal = this.findLoadedApp(id);
        if (!loadedAppInternal) {
            return Promise.reject(`No app found with id: ${id}`);
        }

        console.info(`Reloading app '${loadedAppInternal.pluginName}' with id: ${id}`);

        this.fireAboutToUnloadEvent(loadedAppInternal);

        this.resourceManager.unloadAppResources(loadedAppInternal);
        const {portalAppWrapperElement, portalAppHostElement, portalAppTitleElement} =
            this.createAppWrapper(loadedAppInternal.id, loadedAppInternal.pluginName, loadedAppInternal.instanceId);
        const parent = loadedAppInternal.portalAppWrapperElement.parentElement;
        if (parent) {
            parent.replaceChild(portalAppWrapperElement, loadedAppInternal.portalAppWrapperElement);
        }
        loadedAppInternal.portalAppWrapperElement = portalAppWrapperElement;
        loadedAppInternal.portalAppHostElement = portalAppHostElement;
        loadedAppInternal.portalAppTitleElement = portalAppTitleElement;
        loadedAppInternal.loadedTs = Date.now();

        return this.loadAppSetupAndStart(loadedAppInternal, overrideAppConfig).then(
            () => {
                return this.toLoadedApp(loadedAppInternal);
            }
        );
    }

    unloadApp(id: string) {
        const loadedAppInternal = this.findLoadedApp(id);
        if (!loadedAppInternal) {
            console.error(`No app found with id: ${id}`);
            return;
        }

        console.info(`Unloading app '${loadedAppInternal.pluginName}' with id: ${id}`);
        this.fireAboutToUnloadEvent(loadedAppInternal);

        const removeHostElemAndUnloadResources = () => {
            const parent = loadedAppInternal.portalAppWrapperElement.parentElement;
            if (parent) {
                parent.removeChild(loadedAppInternal.portalAppWrapperElement);
            }

            this.unsubscribeFromMessageBus(loadedAppInternal);
            this.stopCheckForAppUpdates(loadedAppInternal);
            this.resourceManager.unloadAppResources(loadedAppInternal);

            const idx = loadedPortalAppsInternal.indexOf(loadedAppInternal);
            loadedPortalAppsInternal.splice(idx, 1);

            if (loadedAppInternal.modal) {
                const modalOverlayElem = document.getElementById(MODAL_OVERLAY_ID);
                if (modalOverlayElem) {
                    modalOverlayElem.classList.remove('show');
                }
            }
        };

        const handleError = (error: Error) => {
            console.warn(`Calling willBeRemoved callback of app '${loadedAppInternal.pluginName}' failed`, error);
            this.remoteLogger.warn('Calling willBeRemoved callback failed', error, loadedAppInternal.pluginName);
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
        const loadedAppInternal = this.findLoadedApp(id);
        if (!loadedAppInternal) {
            console.error(`No app found with id: ${id}`);
            return;
        }

        this.fireAboutToUnloadEvent(loadedAppInternal);
        this.insertPortalAppIntoDOM(loadedAppInternal.portalAppWrapperElement, newAppAreaId, newPosition);
        this.fireLoadEvent(loadedAppInternal);
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
        this.loadListeners.push(listener);
    }

    unregisterAppLoadedListener(listener: MashroomPortalAppLoadListener) {
        this.loadListeners = this.loadListeners.filter((l) => l !== listener);
    }

    registerAppAboutToUnloadListener(listener: MashroomPortalAppLoadListener) {
        this.aboutToUnloadListeners.push(listener);
    }

    unregisterAppAboutToUnloadListener(listener: MashroomPortalAppLoadListener) {
        this.aboutToUnloadListeners = this.aboutToUnloadListeners.filter((l) => l !== listener);
    }

    loadAppSetup(pluginName: string, instanceId: string | undefined | null): Promise<MashroomPortalAppSetup> {
        const pageId = this.getPageId();
        return this.internalLoadAppSetup(pageId, pluginName, instanceId);
    }

    get loadedPortalApps(): Array<MashroomPortalLoadedPortalApp> {
        return loadedPortalAppsInternal.map((loadedAppInternal) => this.toLoadedApp(loadedAppInternal));
    }

    private internalLoadApp(portalAppAreaId: string, pluginName: string, instanceId: string | undefined | null, modal: boolean,
             position?: number | undefined | null, overrideAppConfig?: any | undefined | null): Promise<LoadedPortalAppInternal> {

        const id = String(this.lastId++);
        const {portalAppWrapperElement, portalAppHostElement, portalAppTitleElement} = this.appendAppWrapper(id, pluginName, instanceId, portalAppAreaId, position);
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
            lifecycleHooks: undefined,
            modal,
            error: false
        };
        loadedPortalAppsInternal.push(loadedAppInternal);

        return this.loadAppSetupAndStart(loadedAppInternal, overrideAppConfig).then(
            () => {
                return loadedAppInternal;
            }
        );
    }

    private loadAppSetupAndStart(loadedPortalAppInternal: LoadedPortalAppInternal, overrideAppConfig?: any | undefined | null): Promise<void> {
        const pageId = this.getPageId();

        return this.internalLoadAppSetup(pageId, loadedPortalAppInternal.pluginName, loadedPortalAppInternal.instanceId).then(
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
                this.fireLoadEvent(loadedPortalAppInternal);

                return this.loadResources(loadedPortalAppInternal).then(
                    () => {
                        console.info(`Starting portal app '${loadedPortalAppInternal.pluginName}' with setup: `, appSetup);
                        return this.startApp(loadedPortalAppInternal.id, loadedPortalAppInternal.portalAppHostElement, appSetup, loadedPortalAppInternal.pluginName).then(
                            (lifecycleHooks: MashroomPortalAppLifecycleHooks | void) => {
                                loadedPortalAppInternal.lifecycleHooks = lifecycleHooks;
                            }
                        );
                    }
                )
            }
        ).catch((error) => {
            this.showLoadingError(loadedPortalAppInternal);
            console.error('Loading app setup failed!', error);
            loadedPortalAppInternal.error = true;
            this.fireLoadEvent(loadedPortalAppInternal);
            return Promise.resolve();
        });
    }

    private internalLoadAppSetup(pageId: string, pluginName: string, instanceId: string | undefined | null): Promise<MashroomPortalAppSetup> {
        if (instanceId) {
            const preloadedAppSetup = (global as any)[WINDOW_VAR_PORTAL_PRELOADED_APP_SETUP] || {};
            if (preloadedAppSetup.hasOwnProperty(instanceId)) {
                console.info('Using preloaded app setup for app: ', pluginName);
                const appSetup = preloadedAppSetup[instanceId];
                // Use only once at the start and not on reload
                delete preloadedAppSetup[instanceId];
                return Promise.resolve(appSetup);
            }
        }

        const path = `/pages/${pageId}/portal-app-instances/${pluginName}${instanceId ? `/${instanceId}` : ''}`;
        return this.restService.get(path);
    }

    private loadResources(loadedPortalApp: LoadedPortalAppInternal): Promise<void> {
        const appSetup = loadedPortalApp.appSetup;
        if (!appSetup) {
            return Promise.reject('appSetup not loaded');
        }

        // JavaScript
        // Load the script sequentially, first the shared ones
        let loadJsPromise: Promise<void> =  Promise.resolve();
        if (appSetup.sharedResources && appSetup.sharedResources.js) {
            loadJsPromise = appSetup.sharedResources.js.reduce(
                (promise, jsResource) => promise.then(() => this.resourceManager.loadJs(`${appSetup.sharedResourcesBasePath}/js/${jsResource}`, loadedPortalApp)),
                loadJsPromise);
        }
        if (appSetup.resources.js) {
            loadJsPromise = appSetup.resources.js.reduce(
                (promise, jsResource) => promise.then(() => this.resourceManager.loadJs(`${appSetup.resourcesBasePath}/${jsResource}?v=${appSetup.lastReloadTs}`, loadedPortalApp)),
                loadJsPromise);
        }

        // CSS
        // We don't have to wait for CSS resources before we can start the app
        if (appSetup.sharedResources && appSetup.sharedResources.css) {
            appSetup.sharedResources.css.forEach((cssResource) =>
                this.resourceManager.loadStyle(`${appSetup.sharedResourcesBasePath}/css/x${cssResource}`, loadedPortalApp));
        }
        if (appSetup.resources.css) {
            appSetup.resources.css.forEach((cssResource) =>
                this.resourceManager.loadStyle(`${appSetup.resourcesBasePath}/${cssResource}?v=${appSetup.lastReloadTs}`, loadedPortalApp));
        }

        return loadJsPromise;
    }

    private startApp(appId: string, wrapper: HTMLElement, appSetup: MashroomPortalAppSetup, pluginName: string): Promise<MashroomPortalAppLifecycleHooks | void> {
        const bootstrap: MashroomPortalAppPluginBootstrapFunction = (global as any)[appSetup.globalLaunchFunction];
        if (!bootstrap) {
            return Promise.reject(`App bootstrap function not found: ${appSetup.globalLaunchFunction}`);
        }

        const clientServices = this.getClientServicesForApp(appId, appSetup, pluginName);
        const handleError = (error: Error) => {
            console.error(`Error in bootstrap of app: ${pluginName}`, error);
            this.remoteLogger.error('Error during bootstrap execution', error, pluginName);
        };

        let bootstrapRetVal = null;
        try {
            bootstrapRetVal = bootstrap(wrapper, appSetup, clientServices) as any;
        } catch (error) {
            handleError(error);
            return Promise.reject(error);
        }

        if (bootstrapRetVal) {
            if (typeof (bootstrapRetVal.then) === 'function') {
                const promise = bootstrapRetVal as Promise<void | MashroomPortalAppLifecycleHooks>;
                return promise.then(
                    (lifecycleMethods) => {
                        console.info(`App successfully loaded: ${pluginName}`);
                        return lifecycleMethods;
                    }
                ).catch((error) => {
                    handleError(error);
                    return Promise.reject(error);
                });
            } else {
                console.info(`App successfully loaded: ${pluginName}`);
                const lifecycleHooks = bootstrapRetVal as MashroomPortalAppLifecycleHooks;
                return Promise.resolve(lifecycleHooks);
            }
        } else {
            console.info(`App successfully loaded: ${pluginName}`);
        }

        return Promise.resolve();
    }

    private showModalOverlay(loadedApp: LoadedPortalAppInternal, title?: string | undefined | null, onClose?: ModalAppCloseCallback | undefined | null) {
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

    private appendAppWrapper(id: string, pluginName: string, instanceId: string | undefined | null, portalAppAreaId: string, position?: number | undefined | null) {
        console.log(`Adding wrapper for app: ${pluginName}, host element: ${portalAppAreaId}, position: ${String(position)}`);

        const {portalAppWrapperElement, portalAppHostElement, portalAppTitleElement} = this.createAppWrapper(id, pluginName, instanceId);

        this.insertPortalAppIntoDOM(portalAppWrapperElement, portalAppAreaId, position);

        return {portalAppWrapperElement, portalAppHostElement, portalAppTitleElement};
    }

    private insertPortalAppIntoDOM(portalAppWrapperElement: HTMLDivElement, portalAppAreaId: string, position?: number | undefined | null) {
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

    private getClientServicesForApp(appId: string, appSetup: MashroomPortalAppSetup, pluginName: string): MashroomPortalClientServices {
        const clientServices: MashroomPortalClientServices = (global as any)[WINDOW_VAR_PORTAL_SERVICES];
        const customServiceMapping: Record<string, string> = (global as any)[WINDOW_VAR_PORTAL_CUSTOM_CLIENT_SERVICES] || {};

        const customServices: Record<string, any> = {};
        for (const customServiceKey in customServiceMapping) {
            if (customServiceMapping.hasOwnProperty(customServiceKey)) {
                customServices[customServiceKey] = (global as any)[customServiceMapping[customServiceKey]];
            }
        }

        const clonedClientServices: MashroomPortalClientServices = {
            ...clientServices,
            messageBus: this.getMessageBusForApp(clientServices, appId),
            stateService: this.getStateServiceForApp(clientServices, pluginName, appSetup),
            remoteLogger: clientServices.remoteLogger.getAppInstance(pluginName),
            ...customServices,
        }

        return Object.freeze(clonedClientServices);
    }

    private createAppWrapper(id: string, pluginName: string, title: string | undefined | null) {
        const createAppWrapper = (global as any)[WINDOW_VAR_PORTAL_CUSTOM_CREATE_APP_WRAPPER_FUNC] || defaultCreateAppWrapper;
        return createAppWrapper(id, pluginName, title);
    }

    private showLoadingError(portalApp: LoadedPortalAppInternal) {
        const createLoadingError = (global as any)[WINDOW_VAR_PORTAL_CUSTOM_CREATE_LOADING_ERROR_FUNC] || defaultCreateLoadingError;
        const errorElement = createLoadingError(portalApp.id, portalApp.pluginName, portalApp.title);

        portalApp.portalAppHostElement.innerHTML = '';
        portalApp.portalAppHostElement.appendChild(errorElement);
    }

    private findLoadedPortalApps(pluginName: string, instanceId: string | undefined | null) {
        const loadedApps: Array<LoadedPortalAppInternal> = [];

        loadedPortalAppsInternal.forEach((loadedApp) => {
            if (loadedApp.pluginName === pluginName) {
                if (!instanceId || loadedApp.instanceId === instanceId) {
                    loadedApps.push(loadedApp);
                }
            }
        });

        return loadedApps;
    }

    private findLoadedApp(id: string) {
        return loadedPortalAppsInternal.find((app) => app.id === id);
    }

    private getMessageBusForApp(clientServices: MashroomPortalClientServices, appId: string): MashroomPortalMessageBus {
        const mmb = clientServices.messageBus as MashroomPortalMasterMessageBus;
        return mmb.getAppInstance(appId);
    }

    private getStateServiceForApp(clientServices: MashroomPortalClientServices, pluginName: string, appSetup: MashroomPortalAppSetup): MashroomPortalStateService {
        const appStatePrefix = `${appSetup.instanceId || `${this.getPageId()}_${encodeURIComponent(pluginName)}`}__`;
        const mss = clientServices.stateService as MashroomPortalMasterStateService;
        return mss.withKeyPrefix(appStatePrefix);
    }

    private unsubscribeFromMessageBus(loadedAppInternal: LoadedPortalAppInternal): void {
        const clientServices: MashroomPortalClientServices = (global as any)[WINDOW_VAR_PORTAL_SERVICES];
        const mmb = clientServices.messageBus as MashroomPortalMasterMessageBus;
        mmb.unsubscribeEverythingFromApp(loadedAppInternal.id);
    }

    private getPageId() {
        const pageId = (global as any)[WINDOW_VAR_PORTAL_PAGE_ID];
        if (!pageId) {
            throw new Error('Unable to determine the current pageId!');
        }
        return pageId;
    }

    private toLoadedApp(loadedAppInternal: LoadedPortalAppInternal): MashroomPortalLoadedPortalApp {
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

    private updateApp(app: MashroomAvailablePortalApp): Promise<any> {
        const promises: Array<Promise<any>> = [];
        console.info('Reloading all instances of app:', app.name);
        this.loadedPortalApps
            .filter((loadedApp) => loadedApp.pluginName === app.name)
            .forEach((loadedApp) => {
                promises.push(this.reloadApp(loadedApp.id));
            });

        return Promise.all(promises);
    }

    private pluginUpdateEventReceived(type: MashroomPortalPluginType, plugin: any) {
        if (type === 'app') {
            return this.updateApp(plugin);
        } else {
            console.info('Theme or Layout changed - reloading browser window');
            location.reload();
        }
    }

    private checkForAppUpdates() {
        // console.info('Checking for app updates since: ', this._lastUpdatedCheckTs);

        this.restService.get(`/portal-apps?updatedSince=${this.lastUpdatedCheckTs}`, {
            'x-mashroom-does-not-extend-auth': '1'
        }).then(
            (updatedApps: Array<MashroomAvailablePortalApp>) => {
                if (Array.isArray(updatedApps) && updatedApps.length > 0) {
                    console.info('Updated apps found:', updatedApps);
                    let promise = Promise.resolve();
                    updatedApps
                        .filter((app) => this.watchedApps.find((watchedApp) => watchedApp.pluginName === app.name))
                        .forEach((app) => {
                            promise = promise.then(() => this.updateApp(app));
                        });
                    if (promise) {
                        promise.then(
                            () => {
                                // Nothing to do
                            },
                            (error) => {
                                console.error('Failed to update some apps', error);
                            }
                        )
                    }
                }
            }
        );

        this.lastUpdatedCheckTs = Date.now();
    }

    private startCheckForAppUpdates(loadedAppInternal: LoadedPortalAppInternal): void {
        // Remove existing
        this.stopCheckForAppUpdates(loadedAppInternal);

        this.watchedApps.push(loadedAppInternal);
        if (!window.EventSource) {
            if (!this.watchTimer) {
                this.watchTimer = setInterval(this.checkForAppUpdates.bind(this), APP_UPDATE_CHECK_INTERVAL);
            }
        } else if (!this.appsUpdateEventSource) {
            this.appsUpdateEventSource = new EventSource('/portal/web/___/api/portal-push-plugin-updates');
            this.appsUpdateEventSource.onmessage = (msg: any) => {
                const event = JSON.parse(msg.data);
                this.pluginUpdateEventReceived(event.type, event.event);
            };
        }
    }

    private stopCheckForAppUpdates(loadedAppInternal: LoadedPortalAppInternal): void {
        this.watchedApps = this.watchedApps.filter((app) => app.id !== loadedAppInternal.id);
        if (this.watchedApps.length === 0 && this.watchTimer) {
            clearInterval(this.watchTimer);
            this.watchTimer = null;
        }

        if (this.watchedApps.length === 0 && this.appsUpdateEventSource) {
            this.appsUpdateEventSource.close();
        }
    }

    private fireLoadEvent(loadedAppInternal: LoadedPortalAppInternal) {
        const loadedApp = this.toLoadedApp(loadedAppInternal);
        try {
            this.loadListeners.forEach((l) => l(loadedApp));
        } catch (e) {
            this.remoteLogger.error('Load listener threw an error', e);
            console.error('Load listener threw an error: ', e);
        }
    }

    private fireAboutToUnloadEvent(loadedAppInternal: LoadedPortalAppInternal) {
        const loadedApp = this.toLoadedApp(loadedAppInternal);
        try {
            this.aboutToUnloadListeners.forEach((l) => l(loadedApp));
        } catch (e) {
            this.remoteLogger.error('AboutToUnload listener threw an error', e);
            console.error('AboutToUnload listener threw an error: ', e);
        }
    }
}
