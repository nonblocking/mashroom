
import {nanoid} from 'nanoid';
import {
    WINDOW_VAR_PORTAL_API_PATH,
    WINDOW_VAR_PORTAL_CUSTOM_CLIENT_SERVICES,
    WINDOW_VAR_PORTAL_DEV_MODE,
    WINDOW_VAR_PORTAL_PAGE_ID,
    WINDOW_VAR_PORTAL_PRELOADED_APP_SETUP,
    WINDOW_VAR_PORTAL_SERVICES,
    WINDOW_VAR_PORTAL_APP_WRAPPER_TEMPLATE,
    WINDOW_VAR_PORTAL_APP_ERROR_TEMPLATE,
    SERVER_SIDE_RENDERED_EMBEDDED_APP_INSTANCE_ID_PREFIX,
} from '../../../backend/constants';
import {HEADER_DO_NOT_EXTEND_SESSION} from './headers';

import type {
    MashroomPortalLoadedPortalAppStats,
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
    MasterMashroomPortalRemoteLogger,
    ModalAppCloseCallback,
    MashroomPortalRemoteLogger,
    MashroomPortalAppConfigEditor,
    MashroomKnownPortalApp,
    AppSearchFilter,
} from '../../../../type-definitions';
import type {MashroomPortalPluginType, MashroomRestService} from '../../../../type-definitions/internal';
import type ResourceManager from './ResourceManager';

export type LoadedPortalAppInternal = {
    readonly id: string;
    readonly pluginName: string;
    instanceId: string | undefined | null;
    title: string | undefined | null;
    appSetup: MashroomPortalAppSetup | undefined | null;
    loadedTs: number;
    portalAppAreaId: string;
    portalAppWrapperElement: HTMLElement;
    portalAppHostElement: HTMLElement;
    portalAppTitleElement: HTMLElement | undefined;
    lifecycleHooks: MashroomPortalAppLifecycleHooks | void;
    readonly modal: boolean;
    readonly editorConfig: MashroomPortalAppConfigEditor | null | undefined;
    error: boolean;
    errorPluginMissing: boolean;
}

type OpenModalApps = {
    readonly loadedApp: LoadedPortalAppInternal;
    readonly modalTitle: string;
    readonly onClose?: ModalAppCloseCallback | undefined | null;
}

const HOST_ELEMENT_MODAL_OVERLAY = 'mashroom-portal-modal-overlay-app';
const MODAL_OVERLAY_ID = 'mashroom-portal-modal-overlay';
const MODAL_OVERLAY_CLOSE_BUTTON_ID = 'mashroom-portal-modal-overlay-close';
const MODAL_OVERLAY_TITLE_ID = 'mashroom-portal-modal-overlay-title';
const APP_INFO_CLASS_NAME = 'mashroom-portal-app-info';

const DEV_MODE_APP_UPDATE_CHECK_INTERVAL = 3000;

export const loadedPortalAppsInternal: Array<LoadedPortalAppInternal> = [];
let _openModalApps: Array<OpenModalApps> = [];
let _modalInitialized = false;

export default class MashroomPortalAppServiceImpl implements MashroomPortalAppService {

    private _apiPath: string;
    private _restService: MashroomRestService;
    private _loadListeners: Array<MashroomPortalAppLoadListener>;
    private _aboutToUnloadListeners: Array<MashroomPortalAppLoadListener>;
    private _watch: boolean;
    private _watchedApps: Array<LoadedPortalAppInternal>;
    private _watchTimer: any | undefined | null;
    private _lastUpdatedCheckTs: number;
    private _appsUpdateEventSource: EventSource | undefined;

    constructor(restService: MashroomRestService, private _resourceManager: ResourceManager) {
        this._apiPath = (global as any)[WINDOW_VAR_PORTAL_API_PATH];
        console.debug('Using portal api path:', this._apiPath);
        this._restService = restService.withBasePath(this._apiPath);
        this._loadListeners = [];
        this._aboutToUnloadListeners = [];
        this._watch = !!(global as any)[WINDOW_VAR_PORTAL_DEV_MODE];
        this._watchedApps = [];
        this._watchTimer = null;
        this._lastUpdatedCheckTs = Date.now();
    }

    getAvailableApps(): Promise<Array<MashroomAvailablePortalApp>> {
        const path = `/portal-apps`;
        return this._restService.get(path);
    }

    searchApps(filter?: AppSearchFilter): Promise<Array<MashroomKnownPortalApp>> {
        let path = `/portal-apps`;
        const queryParams: Array<string> = [];
        if (filter?.q) {
            queryParams.push(`q=${filter.q}`);
        }
        if (filter?.includeNotPermitted) {
            queryParams.push('includeNotPermitted=1');
        }
        if (queryParams.length) {
            path += `?${queryParams.join('&')}`;
        }
        return this._restService.get(path);
    }

    loadApp(hostElementId: string, pluginName: string, instanceId: string | undefined | null, position?: number | undefined | null,
            overrideAppConfig?: any | undefined | null): Promise<MashroomPortalLoadedPortalApp> {
        if (instanceId && this._findLoadedPortalApps(pluginName, instanceId).length > 0) {
            return Promise.reject(`App ${pluginName}' with instance id ${instanceId} is already loaded!`);
        }

        console.info(`Loading App '${pluginName}' with instance id: ${instanceId || '<undefined>'}`);

        return this._internalLoadApp(hostElementId, pluginName, instanceId, false, position, overrideAppConfig).then(
            (loadedApp) => {
                if (this._watch) {
                    this._devModeStartCheckForAppUpdates(loadedApp);
                }
                return this._toLoadedApp(loadedApp);
            }
        );
    }

    loadAppModal(pluginName: string, title?: string | undefined | null, overrideAppConfig?: any | undefined | null,
                 onClose?: ModalAppCloseCallback | undefined | null): Promise<MashroomPortalLoadedPortalApp> {
        console.info(`Loading App '${pluginName}' modal`);

        return this._internalLoadApp(HOST_ELEMENT_MODAL_OVERLAY, pluginName, null, true, null, overrideAppConfig).then(
            (loadedApp) => {
                if (this._watch) {
                    this._devModeStartCheckForAppUpdates(loadedApp);
                }

                const internalOnClose = () => {
                    if (this._watch) {
                        this._devModeStopCheckForAppUpdates(loadedApp);
                    }
                    onClose?.();
                };

                this._showModalOverlay(loadedApp, title, internalOnClose);

                return this._toLoadedApp(loadedApp);
            }
        );
    }

    reloadApp(id: string, overrideAppConfig?: any | undefined | null): Promise<MashroomPortalLoadedPortalApp> {
        const loadedAppInternal = this._findLoadedApp(id);
        if (!loadedAppInternal) {
            return Promise.reject(`Cannot reload App because id not found: ${id}`);
        }

        console.info(`Reloading App '${loadedAppInternal.pluginName}' with id: ${id}`);
        this._fireAboutToUnloadEvent(loadedAppInternal);

        return this._executeWillBeRemovedCallback(loadedAppInternal).then(() => {
            this._resourceManager.unloadAppResources(loadedAppInternal);

            const {portalAppWrapperElement, portalAppHostElement, portalAppTitleElement} =
                this._createAppWrapper(loadedAppInternal.id, loadedAppInternal.pluginName, loadedAppInternal.title);
            const parent = loadedAppInternal.portalAppWrapperElement.parentElement;
            if (parent) {
                parent.replaceChild(portalAppWrapperElement, loadedAppInternal.portalAppWrapperElement);
            }
            loadedAppInternal.portalAppWrapperElement = portalAppWrapperElement;
            loadedAppInternal.portalAppHostElement = portalAppHostElement;
            loadedAppInternal.portalAppTitleElement = portalAppTitleElement;
            loadedAppInternal.loadedTs = Date.now();

            const pageId = this._getPageId();

            return this._internalLoadAppSetup(pageId, loadedAppInternal.pluginName, loadedAppInternal.instanceId).then(
                (appSetup: MashroomPortalAppSetup) => {
                    // Keep existing appConfig for dynamically loaded Apps (e.g. during hot reload)
                    const existingAppConfig = !loadedAppInternal.instanceId && loadedAppInternal.appSetup?.appConfig || {};
                    appSetup = {
                        ...appSetup,
                        appConfig: {...appSetup.appConfig, ...existingAppConfig, ...overrideAppConfig || {}}
                    };
                    loadedAppInternal.appSetup = appSetup;
                    loadedAppInternal.instanceId = appSetup.instanceId;
                    loadedAppInternal.title = appSetup.title;

                    this._fireLoadEvent(loadedAppInternal);

                    return this._loadResources(loadedAppInternal).then(
                        () => {
                            console.info(`Reloading App '${loadedAppInternal.pluginName}' with setup:`, appSetup);
                            return this._startApp(loadedAppInternal.id, loadedAppInternal.portalAppHostElement, appSetup, loadedAppInternal.pluginName).then(
                                (lifecycleHooks: MashroomPortalAppLifecycleHooks | void) => {
                                    loadedAppInternal.lifecycleHooks = lifecycleHooks;
                                    return this._toLoadedApp(loadedAppInternal);
                                }
                            );
                        }
                    );
                });
            }
        ).catch((error) => {
            this._showLoadingError(loadedAppInternal);
            console.error(`Reloading App '${loadedAppInternal.pluginName}' failed!`, error);
            loadedAppInternal.error = true;
            this._fireLoadEvent(loadedAppInternal);
            return this._toLoadedApp(loadedAppInternal);
        });
    }

    unloadApp(id: string): void {
        const loadedAppInternal = this._findLoadedApp(id);
        if (!loadedAppInternal) {
            console.error(`Cannot unload App because id not found: ${id}`);
            return;
        }

        console.info(`Unloading App '${loadedAppInternal.pluginName}' with id: ${id}`);
        this._fireAboutToUnloadEvent(loadedAppInternal);

        this._executeWillBeRemovedCallback(loadedAppInternal).then(() => {
            const parent = loadedAppInternal.portalAppWrapperElement.parentElement;
            if (parent) {
                parent.removeChild(loadedAppInternal.portalAppWrapperElement);
            }

            this._unsubscribeFromMessageBus(loadedAppInternal);
            this._devModeStopCheckForAppUpdates(loadedAppInternal);
            this._resourceManager.unloadAppResources(loadedAppInternal);

            const idx = loadedPortalAppsInternal.indexOf(loadedAppInternal);
            loadedPortalAppsInternal.splice(idx, 1);

            if (loadedAppInternal.modal) {
                _openModalApps = _openModalApps.filter((ma) => ma.loadedApp.id !== loadedAppInternal.id);
                this._updateModalState();
            }
        });
    }

    moveApp(id: string, newAppAreaId: string, newPosition?: number): void {
        const loadedAppInternal = this._findLoadedApp(id);
        if (!loadedAppInternal) {
            console.error(`Cannot move App because id not found: ${id}`);
            return;
        }

        this._fireAboutToUnloadEvent(loadedAppInternal);
        this._insertPortalAppIntoDOM(loadedAppInternal.portalAppWrapperElement, newAppAreaId, newPosition);
        this._fireLoadEvent(loadedAppInternal);
    }

    showAppInfos(customize?: (portalApp: MashroomPortalLoadedPortalApp, overlay: HTMLDivElement) => void): void {
        const showInfo = (portalApp: MashroomPortalLoadedPortalApp) => {
            const stats = this.getAppStats(portalApp.pluginName);
            let statsString = '';
            if (stats) {
                statsString = `(${stats.resources} ${stats.resources > 1 ? 'files' : 'file'}${stats.totalSizeHumanReadable ? `, ${stats.totalSizeHumanReadable}` : ''})`;
            }

            portalApp.portalAppWrapperElement.style.position = 'relative';
            const appInfoElem = document.createElement('div');
            appInfoElem.className = APP_INFO_CLASS_NAME;
            appInfoElem.style.position = 'absolute';
            appInfoElem.innerHTML = `
                <div class="portal-app-name">${portalApp.pluginName}</div>
                <div class="portal-app-version">v${portalApp.version || '?.?.?'} ${statsString}</div>
            `;

            if (customize) {
                customize(portalApp, appInfoElem);
            }

            portalApp.portalAppWrapperElement.appendChild(appInfoElem);
        };

        this.loadedPortalApps.forEach((portalApp) => showInfo(portalApp));

        this._fixAppInfoOverlaps();
    }

    hideAppInfos(): void {
        const overlays = document.querySelectorAll(`.${APP_INFO_CLASS_NAME}`);
        for (let i = 0; i < overlays.length; ++i) {
            const overlay = overlays[i];
            overlay.parentElement?.removeChild(overlay);
        }
    }

    registerAppLoadedListener(listener: MashroomPortalAppLoadListener): void {
        this._loadListeners.push(listener);
    }

    unregisterAppLoadedListener(listener: MashroomPortalAppLoadListener): void {
        this._loadListeners = this._loadListeners.filter((l) => l !== listener);
    }

    registerAppAboutToUnloadListener(listener: MashroomPortalAppLoadListener): void {
        this._aboutToUnloadListeners.push(listener);
    }

    unregisterAppAboutToUnloadListener(listener: MashroomPortalAppLoadListener): void {
        this._aboutToUnloadListeners = this._aboutToUnloadListeners.filter((l) => l !== listener);
    }

    loadAppSetup(pluginName: string, instanceId: string | undefined | null): Promise<MashroomPortalAppSetup> {
        const pageId = this._getPageId();
        return this._internalLoadAppSetup(pageId, pluginName, instanceId);
    }

    getAppStats(pluginName: string): MashroomPortalLoadedPortalAppStats | null {
        if (!global.performance) {
            return null;
        }
        const timings: Array<PerformanceResourceTiming> = [];
        global.performance.getEntriesByType('resource')
            .forEach((r) => {
                if (decodeURI(r.name).indexOf(`/apps/${pluginName}/`) !== -1 && !timings.find((r2) => r.name.split('?')[0] === r2.name.split('?')[0])) {
                    timings.push(r as PerformanceResourceTiming);
                }
            });

        if (timings.length === 0) {
            return null;
        }

        let totalSize;
        let totalSizeHumanReadable;
        // Safari doesn't provide encodedBodySize
        if (timings[0].decodedBodySize) {
            totalSize = timings.reduce((sum, r) => sum + r.decodedBodySize, 0);
            let totalSizeUnit = 'B';
            let size = totalSize;
            if (size > 1024) {
                size = Math.round(size / 1024);
                totalSizeUnit = 'kB';
            }
            if (size > 1024) {
                size = Math.round(size / 10.24) / 100;
                totalSizeUnit = 'MB';
            }
            totalSizeHumanReadable = `${size} ${totalSizeUnit}`;
        }

        return {
            resources: timings.length,
            totalSize,
            totalSizeHumanReadable,
        };
    }

    checkLoadedPortalAppsUpdated(): Promise<Array<string>> {
        /* if we are not in dev mode _lastUpdatedCheckTs is the page load time */
        return this._getUpdatedAppsSince(this._lastUpdatedCheckTs)
            .then((updatedApps) => {
                const updatedAppsWithNewVersion: Array<string> = [];
                updatedApps.forEach((ua) => {
                    const isNewVersion = loadedPortalAppsInternal.find(({ pluginName, appSetup }) => ua.name === pluginName && ua.version !== appSetup?.version);
                    if (isNewVersion && updatedAppsWithNewVersion.indexOf(ua.name) === -1) {
                        updatedAppsWithNewVersion.push(ua.name);
                    }
                });
                return updatedAppsWithNewVersion;
            })
            .catch((e) => {
                console.warn('Check for updated Apps failed!', e);
                return [];
            });
    }

    prefetchResources(pluginName: string): Promise<void> {
        const pageId = this._getPageId();
        return this._internalLoadAppSetup(pageId, pluginName, null).then(
            (appSetup) => {
                // We just add a prefetch link for all resources (see https://developer.mozilla.org/en-US/docs/Web/HTTP/Link_prefetching_FAQ)
                if (appSetup.sharedResources?.js) {
                    appSetup.sharedResources.js.forEach((jsResource) => this._getSharedJSResourceUrl(jsResource, appSetup));
                }
                if (appSetup.resources.js) {
                    appSetup.resources.js.forEach((jsResource) => this._addPrefetchLink(this._getJSResourceUrl(jsResource, appSetup)));
                }
                if (appSetup.sharedResources?.css) {
                    appSetup.sharedResources.css.forEach((jsResource) => this._addPrefetchLink(this._getSharedCSSResourceUrl(jsResource, appSetup)));
                }
                if (appSetup.resources.css) {
                    appSetup.resources.css.forEach((jsResource) => this._addPrefetchLink(this._getCSSResourceUrl(jsResource, appSetup)));
                }
            }
        );
    }

    get loadedPortalApps(): Array<MashroomPortalLoadedPortalApp> {
        return loadedPortalAppsInternal.map((loadedAppInternal) => this._toLoadedApp(loadedAppInternal));
    }

    private _internalLoadApp(portalAppAreaId: string, pluginName: string, instanceId: string | undefined | null, modal: boolean,
             position?: number | undefined | null, overrideAppConfig?: any | undefined | null): Promise<LoadedPortalAppInternal> {

        const pageId = this._getPageId();
        let loadedAppInternal: LoadedPortalAppInternal | undefined;

        return this._internalLoadAppSetup(pageId, pluginName, instanceId).then(
            (appSetup: MashroomPortalAppSetup) => {
                if (overrideAppConfig) {
                    const existingAppConfig = appSetup?.appConfig || {};
                    appSetup = {
                        ...appSetup,
                        appConfig: {...appSetup.appConfig, ...existingAppConfig, ...overrideAppConfig}
                    };
                }

                loadedAppInternal = this._createNewAppInstance(appSetup, pluginName, instanceId, portalAppAreaId, position, modal);

                this._fireLoadEvent(loadedAppInternal);

                return this._loadResources(loadedAppInternal).then(
                    () => {
                        console.info(`Starting portal App '${pluginName}' with setup:`, appSetup);
                        return this._startApp(loadedAppInternal!.id, loadedAppInternal!.portalAppHostElement, appSetup, pluginName).then(
                            (lifecycleHooks: MashroomPortalAppLifecycleHooks | void) => {
                                loadedAppInternal!.lifecycleHooks = lifecycleHooks;
                                return loadedAppInternal!;
                            }
                        );
                    }
                );
            }
        ).catch((error) => {
            if (!loadedAppInternal) {
                loadedAppInternal = this._createNewAppInstance(undefined, pluginName, instanceId, portalAppAreaId, position, modal);
            }
            this._showLoadingError(loadedAppInternal);
            console.error(`Loading App '${loadedAppInternal.pluginName}' failed!`, error);
            loadedAppInternal.error = true;
            this._fireLoadEvent(loadedAppInternal);
            return loadedAppInternal;
        });
    }

    private _internalLoadAppSetup(pageId: string, pluginName: string, instanceId: string | undefined | null): Promise<MashroomPortalAppSetup> {
        if (instanceId) {
            const preloadedAppSetup = (global as any)[WINDOW_VAR_PORTAL_PRELOADED_APP_SETUP] || {};
            if (instanceId in preloadedAppSetup) {
                console.info('Using preloaded App setup for app: ', pluginName);
                const appSetup = preloadedAppSetup[instanceId];
                // Use only once at the start and not on reload
                delete preloadedAppSetup[instanceId];
                return Promise.resolve(appSetup);
            }
        }

        const path = `/pages/${pageId}/portal-app-instances/${pluginName}${instanceId ? `/${instanceId}` : ''}`;
        return this._restService.get(path);
    }

    private _loadResources(loadedPortalApp: LoadedPortalAppInternal): Promise<void> {
        const appSetup = loadedPortalApp.appSetup;
        if (!appSetup) {
            return Promise.reject('appSetup not loaded');
        }

        // JavaScript
        // Load the script sequentially, first the shared ones
        let loadJsPromise: Promise<void> =  Promise.resolve();
        if (appSetup.sharedResources?.js) {
            loadJsPromise = appSetup.sharedResources.js.reduce(
                (promise, jsResource) => promise.then(() =>
                    this._resourceManager.loadJs(this._getSharedJSResourceUrl(jsResource, appSetup), loadedPortalApp)),
                loadJsPromise);
        }
        if (appSetup.resources.js) {
            loadJsPromise = appSetup.resources.js.reduce(
                (promise, jsResource) => promise.then(() =>
                    this._resourceManager.loadJs(this._getJSResourceUrl(jsResource, appSetup), loadedPortalApp)),
                loadJsPromise);
        }

        // CSS
        // We don't have to wait for CSS resources before we can start the app
        if (appSetup.sharedResources?.css) {
            appSetup.sharedResources.css.forEach((cssResource) =>
                this._resourceManager.loadStyle(this._getSharedCSSResourceUrl(cssResource, appSetup), loadedPortalApp));
        }
        if (appSetup.resources.css) {
            appSetup.resources.css.forEach((cssResource) =>
                this._resourceManager.loadStyle(this._getCSSResourceUrl(cssResource, appSetup), loadedPortalApp));
        }

        return loadJsPromise;
    }

    private _startApp(appId: string, wrapper: HTMLElement, appSetup: MashroomPortalAppSetup, pluginName: string): Promise<MashroomPortalAppLifecycleHooks | void> {
        if (appSetup.pluginMissing) {
            return Promise.reject(new Error(`Plugin does not exist: ${pluginName}`));
        }

        const bootstrap: MashroomPortalAppPluginBootstrapFunction = (global as any)[appSetup.globalLaunchFunction];
        if (!bootstrap) {
            return Promise.reject(`App bootstrap function not found: ${appSetup.globalLaunchFunction}`);
        }

        const clientServices = this._getClientServicesForApp(appId, appSetup, pluginName);
        const handleError = (error: Error) => {
            console.error(`Error in bootstrap of App '${pluginName}'`, error);
        };

        let bootstrapRetVal = null;
        try {
            bootstrapRetVal = bootstrap(wrapper, appSetup, clientServices) as any;
        } catch (error: any) {
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

    private _showModalOverlay(loadedApp: LoadedPortalAppInternal, title?: string | undefined | null, onClose?: ModalAppCloseCallback | undefined | null) {
        const modalOverlayElem = document.getElementById(MODAL_OVERLAY_ID);
        if (!modalOverlayElem) {
            console.error('Cannot show modal overlay because element not found: ', MODAL_OVERLAY_ID);
            return;
        }

        const modalTitle= title || loadedApp.title || loadedApp.pluginName;

        // Hide App header
        loadedApp.portalAppWrapperElement.classList.add('hide-header');

        _openModalApps.push({
            loadedApp,
            modalTitle,
            onClose,
        });

        this._updateModalState();
    }

    private _updateModalState() {
        const modalOverlayElem = document.getElementById(MODAL_OVERLAY_ID);
        if (!modalOverlayElem) {
            console.error('Cannot show modal overlay because element not found: ', MODAL_OVERLAY_ID);
            return;
        }

        if (_openModalApps.length === 0) {
            modalOverlayElem.classList.remove('show');
            return;
        }
        modalOverlayElem.classList.add('show');

        const modalOverlayTitleElem = document.getElementById(MODAL_OVERLAY_TITLE_ID);
        const modalOverlayCloseButtonElem = document.getElementById(MODAL_OVERLAY_CLOSE_BUTTON_ID);
        const currentApp = _openModalApps[_openModalApps.length - 1];

        // Fix modal title
        if (modalOverlayTitleElem) {
            const numberOpenModals = _openModalApps.length;
            let fullTitleHtml = `<span>${currentApp.modalTitle}</span>`;
            if (numberOpenModals > 1) {
                fullTitleHtml = `<span class="mashroom-portal-modal-overlay-number"><span>(</span>${numberOpenModals}<span>)</span>&nbsp;</span>${fullTitleHtml}`;
            }
            modalOverlayTitleElem.innerHTML = fullTitleHtml;
        }

        // Only make currentApp visible
        _openModalApps.forEach((ma) => {
           ma.loadedApp.portalAppWrapperElement.style.display = ma === currentApp ? 'block' : 'none';
        });

        if (!_modalInitialized) {
            _modalInitialized = true;
            const closeEventListener = () => {
                const currentApp = _openModalApps.pop();
                if (currentApp) {
                    // This will automatically call _updateModalState();
                    this.unloadApp(currentApp.loadedApp.id);
                    currentApp.onClose?.();
                }
            };
            const keyEventListener = (event: KeyboardEvent) => {
                if (_openModalApps.length > 0 && event.key === 'Escape') {
                    closeEventListener();
                }
            };
            if (modalOverlayCloseButtonElem) {
                modalOverlayCloseButtonElem.addEventListener('click', closeEventListener);
            }
            document.addEventListener('keyup', keyEventListener);
        }
    }

    private _appendAppWrapper(id: string, pluginName: string, title: string | undefined | null, portalAppAreaId: string, position?: number | undefined | null) {
        console.log(`Adding wrapper for app: ${pluginName}, host element: ${portalAppAreaId}, position: ${String(position)}`);

        const {portalAppWrapperElement, portalAppHostElement, portalAppTitleElement} = this._createAppWrapper(id, pluginName, title);

        this._insertPortalAppIntoDOM(portalAppWrapperElement, portalAppAreaId, position);

        return {portalAppWrapperElement, portalAppHostElement, portalAppTitleElement};
    }

    private _insertPortalAppIntoDOM(portalAppWrapperElement: HTMLElement, portalAppAreaId: string, position?: number | undefined | null) {
        let inserted = false;

        let parentElem = document.getElementById(portalAppAreaId);
        if (!parentElem) {
            console.error(`App Area ID not found: ${portalAppAreaId} - attaching App to body!`);
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

    private _getClientServicesForApp(appId: string, appSetup: MashroomPortalAppSetup, pluginName: string): MashroomPortalClientServices {
        const clientServices: MashroomPortalClientServices = (global as any)[WINDOW_VAR_PORTAL_SERVICES];
        const customServiceMapping: Record<string, string> = (global as any)[WINDOW_VAR_PORTAL_CUSTOM_CLIENT_SERVICES] || {};

        const customServices: Record<string, any> = {};
        for (const customServiceKey in customServiceMapping) {
            if (customServiceKey in customServiceMapping) {
                customServices[customServiceKey] = (global as any)[customServiceMapping[customServiceKey]];
            }
        }

        const clonedClientServices: MashroomPortalClientServices = {
            ...clientServices,
            messageBus: this._getMessageBusForApp(clientServices, appId),
            stateService: this._getStateServiceForApp(clientServices, pluginName, appSetup),
            remoteLogger: this._getRemoteLoggerForApp(clientServices, pluginName),
            ...customServices,
        };

        return Object.freeze(clonedClientServices);
    }

    private _createNewAppInstance(appSetup: MashroomPortalAppSetup | undefined, pluginName: string, instanceId: string | undefined | null,
                                  portalAppAreaId: string, position: number | undefined | null, modal: boolean): LoadedPortalAppInternal {
        const {appId, title, editorConfig, pluginMissing} = appSetup || { appId: nanoid(8) };
        const {portalAppWrapperElement, portalAppHostElement, portalAppTitleElement} =
            this._appendAppWrapper(appId, pluginName, title, portalAppAreaId, position);
        const loadedAppInternal: LoadedPortalAppInternal = {
            id: appId,
            pluginName,
            instanceId: instanceId?.indexOf(SERVER_SIDE_RENDERED_EMBEDDED_APP_INSTANCE_ID_PREFIX) === -1 ? instanceId : undefined,
            title,
            loadedTs: Date.now(),
            appSetup,
            portalAppAreaId,
            portalAppWrapperElement,
            portalAppHostElement,
            portalAppTitleElement,
            lifecycleHooks: undefined,
            modal,
            editorConfig,
            error: !!pluginMissing,
            errorPluginMissing: !!pluginMissing,
        };
        loadedPortalAppsInternal.push(loadedAppInternal);
        return loadedAppInternal;
    }

    private _createAppWrapper(id: string, pluginName: string, title: string | undefined | null) {
        // Check if there is a server side rendered wrapper
        let portalAppWrapperElement = document.querySelector(`[data-mr-app-id="${id}"]`) as HTMLElement | undefined;
        if (!portalAppWrapperElement) {
            const appWrapperTemplate = (global as any)[WINDOW_VAR_PORTAL_APP_WRAPPER_TEMPLATE];
            const appWrapperHtml = this._processTemplate(appWrapperTemplate, id, pluginName, title);
            const el = document.createElement('div');
            el.innerHTML = appWrapperHtml;
            portalAppWrapperElement = el.firstElementChild as HTMLElement | undefined;
            if (!portalAppWrapperElement) {
                console.error('The App template seems to be empty, using an empty div container');
                portalAppWrapperElement = document.createElement('div');
            }
        }
        let portalAppHostElement = portalAppWrapperElement.querySelector('[data-mr-app-content="app"]') as HTMLElement | undefined;
        const portalAppTitleElement = portalAppWrapperElement.querySelector('[data-mr-app-content="title"]') as HTMLElement | undefined;

        if (!portalAppHostElement) {
            console.error('No element annotated with data-replace-content="app" found in the App template. Adding a extra element node.');
            portalAppHostElement = document.createElement('div');
            portalAppWrapperElement.appendChild(portalAppHostElement);
        }

        return {portalAppWrapperElement, portalAppHostElement, portalAppTitleElement};
    }

    private _showLoadingError(portalApp: LoadedPortalAppInternal): void {
        const appErrorTemplate = (global as any)[WINDOW_VAR_PORTAL_APP_ERROR_TEMPLATE];
        portalApp.portalAppHostElement.innerHTML = this._processTemplate(appErrorTemplate, portalApp.id, portalApp.pluginName, portalApp.title);
    }

    private _processTemplate(template: string, id: string, pluginName: string, title: string | undefined | null) {
        const safePluginName = pluginName.toLowerCase().replace(/ /g, '-');
        return template
            .replace('__APP_ID__', id)
            .replace('__PLUGIN_NAME__', pluginName)
            .replace('__SAFE_PLUGIN_NAME__', safePluginName)
            .replace('__TITLE__', title || pluginName);
    }

    private _findLoadedPortalApps(pluginName: string, instanceId: string | undefined | null) {
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

    private _findLoadedApp(id: string) {
        return loadedPortalAppsInternal.find((app) => app.id === id);
    }

    private _getMessageBusForApp(clientServices: MashroomPortalClientServices, appId: string): MashroomPortalMessageBus {
        const mmb = clientServices.messageBus as MashroomPortalMasterMessageBus;
        return mmb.getAppInstance(appId);
    }

    private _getStateServiceForApp(clientServices: MashroomPortalClientServices, pluginName: string, appSetup: MashroomPortalAppSetup): MashroomPortalStateService {
        const appStatePrefix = `${appSetup.instanceId || `${this._getPageId()}_${encodeURIComponent(pluginName)}`}__`;
        const mss = clientServices.stateService as MashroomPortalMasterStateService;
        return mss.withKeyPrefix(appStatePrefix);
    }

    private _getRemoteLoggerForApp(clientServices: MashroomPortalClientServices, pluginName: string): MashroomPortalRemoteLogger {
        const mrl = clientServices.remoteLogger as MasterMashroomPortalRemoteLogger;
        return mrl.getAppInstance(pluginName);
    }

    private _unsubscribeFromMessageBus(loadedAppInternal: LoadedPortalAppInternal): void {
        const clientServices: MashroomPortalClientServices = (global as any)[WINDOW_VAR_PORTAL_SERVICES];
        const mmb = clientServices.messageBus as MashroomPortalMasterMessageBus;
        mmb.unsubscribeEverythingFromApp(loadedAppInternal.id);
    }

    private _getPageId() {
        const pageId = (global as any)[WINDOW_VAR_PORTAL_PAGE_ID];
        if (!pageId) {
            throw new Error('Unable to determine the current pageId!');
        }
        return pageId;
    }

    private _toLoadedApp(loadedAppInternal: LoadedPortalAppInternal): MashroomPortalLoadedPortalApp {
        return {
            id: loadedAppInternal.id,
            pluginName: loadedAppInternal.pluginName,
            errorPluginMissing: loadedAppInternal.errorPluginMissing,
            title: loadedAppInternal.title,
            version: loadedAppInternal.appSetup?.version,
            instanceId: loadedAppInternal.instanceId,
            portalAppAreaId: loadedAppInternal.portalAppAreaId,
            portalAppWrapperElement: loadedAppInternal.portalAppWrapperElement,
            portalAppHostElement: loadedAppInternal.portalAppHostElement,
            portalAppTitleElement: loadedAppInternal.portalAppTitleElement,
            appConfig: loadedAppInternal.appSetup?.appConfig,
            updateAppConfig: loadedAppInternal.lifecycleHooks?.updateAppConfig,
            editorConfig: loadedAppInternal.editorConfig,
            error: loadedAppInternal.error,
        };
    }

    private _updateApp(app: MashroomAvailablePortalApp): Promise<any> {
        const promises: Array<Promise<any>> = [];
        console.info('Reloading all instances of app:', app.name);
        this.loadedPortalApps
            .filter((loadedApp) => loadedApp.pluginName === app.name)
            .forEach((loadedApp) => {
                promises.push(this.reloadApp(loadedApp.id));
            });

        return Promise.all(promises);
    }

    private _executeWillBeRemovedCallback(loadedAppInternal: LoadedPortalAppInternal): Promise<void> {
        const handleError = (error: Error) => {
            console.warn(`Calling willBeRemoved callback of App '${loadedAppInternal.pluginName}' failed`, error);
            return Promise.resolve();
        };

        if (loadedAppInternal.lifecycleHooks?.willBeRemoved) {
            try {
                const promise = loadedAppInternal.lifecycleHooks.willBeRemoved();
                if (promise?.then) {
                    return promise.then(() => { /* nothing to do */ }).catch((error) => {
                        return handleError(error);
                    });
                } else {
                    return Promise.resolve();
                }
            } catch (error: any) {
                return handleError(error);
            }
        }

        return Promise.resolve();
    }

    private _fireLoadEvent(loadedAppInternal: LoadedPortalAppInternal) {
        const loadedApp = this._toLoadedApp(loadedAppInternal);
        try {
            this._loadListeners.forEach((l) => l(loadedApp));
        } catch (e) {
            console.error('Load listener threw an error: ', e);
        }
    }

    private _fireAboutToUnloadEvent(loadedAppInternal: LoadedPortalAppInternal) {
        const loadedApp = this._toLoadedApp(loadedAppInternal);
        try {
            this._aboutToUnloadListeners.forEach((l) => l(loadedApp));
        } catch (e) {
            console.error('AboutToUnload listener threw an error: ', e);
        }
    }

    private _getSharedJSResourceUrl(jsResource: string, appSetup: MashroomPortalAppSetup): string {
        return `${appSetup.sharedResourcesBasePath}/js/${jsResource}`;
    }

    private _getJSResourceUrl(jsResource: string, appSetup: MashroomPortalAppSetup): string {
        return `${appSetup.resourcesBasePath}/${jsResource}?v=${appSetup.versionHash}`;
    }

    private _getSharedCSSResourceUrl(cssResource: string, appSetup: MashroomPortalAppSetup): string {
        return `${appSetup.sharedResourcesBasePath}/css/${cssResource}`;
    }

    private _getCSSResourceUrl(cssResource: string, appSetup: MashroomPortalAppSetup): string {
        return `${appSetup.resourcesBasePath}/${cssResource}?v=${appSetup.versionHash}`;
    }

    private _addPrefetchLink(url: string): void {
        const prefetchLink = document.createElement('link');
        prefetchLink.rel = 'prefetch';
        prefetchLink.href = url;
        document.head.appendChild(prefetchLink);
    }

    private _fixAppInfoOverlaps(tries?: number) {
        const overlaps: Array<{ top: number, bottom: number, overlapX: number }> = [];
        const overlays = document.querySelectorAll(`.${APP_INFO_CLASS_NAME}`);
        for (let i = 0; i < overlays.length; ++i) {
            const overlay = overlays[i];
            for (let j = 0; j < overlays.length; ++j) {
                if (j !== i && !overlaps.find((o) => o.top === i && o.bottom === j || o.top === j && o.bottom === i)) {
                    const boundingRect1 = overlay.getBoundingClientRect();
                    const boundingRect2 = overlays[j].getBoundingClientRect();
                    if (boundingRect1.bottom > boundingRect2.top
                        && boundingRect1.right > boundingRect2.left
                        && boundingRect1.top < boundingRect2.bottom
                        && boundingRect1.left < boundingRect2.right) {
                        if (boundingRect1.top > boundingRect2.top) {
                            overlaps.push({ top: i, bottom: j, overlapX: boundingRect1.height - (boundingRect1.top - boundingRect2.top) });
                        } else {
                            overlaps.push({ top: j, bottom: i, overlapX: boundingRect2.height - (boundingRect2.top - boundingRect1.top) });
                        }
                    }
                }
            }
        }

        if (overlaps.length > 0) {
            console.debug('App info overlaps found:', overlaps);
            overlaps.forEach(({ top, overlapX}) => {
                // Move the right one further right
                (overlays[top] as HTMLDivElement).style.top = `${overlapX + 2}px`;
            });
            if (!tries || tries < 2) {
                this._fixAppInfoOverlaps((tries ?? 0) + 1);
            }
        }
    }

    private _devModelAppUpdateEventReceived(type: MashroomPortalPluginType, plugin: any) {
        if (type === 'app') {
            return this._updateApp(plugin);
        } else {
            console.info('Theme or Layout changed - reloading browser window');
            location.reload();
        }
    }

    private _devModeCheckForAppUpdates() {
        // console.info('Checking for App updates since: ', this._lastUpdatedCheckTs);

        this._getUpdatedAppsSince(this._lastUpdatedCheckTs).then(
            (updatedApps: Array<MashroomAvailablePortalApp>) => {
                if (Array.isArray(updatedApps) && updatedApps.length > 0) {
                    console.info('Updated apps found:', updatedApps);
                    let promise = Promise.resolve();
                    updatedApps
                        .filter((app) => this._watchedApps.find((watchedApp) => watchedApp.pluginName === app.name))
                        .forEach((app) => {
                            promise = promise.then(() => this._updateApp(app));
                        });
                    if (promise) {
                        promise.then(
                            () => {
                                // Nothing to do
                            },
                            (error) => {
                                console.warn('Failed to update some apps', error);
                            }
                        );
                    }
                }
            }
        );

        this._lastUpdatedCheckTs = Date.now();
    }

    private _devModeStartCheckForAppUpdates(loadedAppInternal: LoadedPortalAppInternal): void {
        // Remove existing
        this._devModeStopCheckForAppUpdates(loadedAppInternal);

        this._watchedApps.push(loadedAppInternal);
        if (!window.EventSource) {
            if (!this._watchTimer) {
                this._watchTimer = setInterval(this._devModeCheckForAppUpdates.bind(this), DEV_MODE_APP_UPDATE_CHECK_INTERVAL);
            }
        } else if (!this._appsUpdateEventSource) {
            const updateSourcePath = `${this._apiPath}/portal-push-plugin-updates`;
            console.debug('Registering for plugin updates:', updateSourcePath);
            this._appsUpdateEventSource = new EventSource(updateSourcePath);
            this._appsUpdateEventSource.onmessage = (msg: any) => {
                const event = JSON.parse(msg.data);
                this._devModelAppUpdateEventReceived(event.type, event.event);
            };
        }
    }

    private _devModeStopCheckForAppUpdates(loadedAppInternal: LoadedPortalAppInternal): void {
        this._watchedApps = this._watchedApps.filter((app) => app.id !== loadedAppInternal.id);
        if (this._watchedApps.length === 0 && this._watchTimer) {
            clearInterval(this._watchTimer);
            this._watchTimer = null;
        }

        if (this._watchedApps.length === 0 && this._appsUpdateEventSource) {
            this._appsUpdateEventSource.close();
        }
    }

    private _getUpdatedAppsSince(ts: number): Promise<Array<MashroomAvailablePortalApp>> {
        return this._restService.get(`/portal-apps?updatedSince=${ts}`, {
            [HEADER_DO_NOT_EXTEND_SESSION]: '1'
        });
    }
}
