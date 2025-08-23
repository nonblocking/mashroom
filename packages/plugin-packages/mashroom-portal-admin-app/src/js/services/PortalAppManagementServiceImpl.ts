
import {nanoid} from 'nanoid';
import {setShowModal} from '@mashroom/mashroom-portal-ui-commons';
import {setSelectedPortalApp} from '../store/actions';
import {
    CSS_CLASS_MASHROOM_PORTAL_APP_AREA,
    CSS_CLASS_APP_CONTROLS,
    CSS_CLASS_APP_DROP_ZONE,
    DIALOG_NAME_PORTAL_APP_CONFIGURE,
} from '../constants';

import type {
    MashroomPortalAppService,
    MashroomPortalAdminService,
    MashroomPortalLoadedPortalApp,
    MashroomPortalConfigEditorTarget,
} from '@mashroom/mashroom-portal/type-definitions';
import type {
    Store, PortalAppManagementService,
} from '../types';

export default class PortalAppManagementServiceImpl implements PortalAppManagementService {

    portalAppService: MashroomPortalAppService;
    portalAdminService: MashroomPortalAdminService;
    store: Store;
    controlsVisible: boolean;
    openContentEditorAppId: string | undefined;
    closeContentEditorCb: (() => void) | undefined;
    dragRunning: boolean;
    trans: (key: string) => string = (key) => key;

    constructor(store: Store, portalAppService: MashroomPortalAppService, portalAdminService: MashroomPortalAdminService) {
        this.store = store;
        this.portalAppService = portalAppService;
        this.portalAdminService = portalAdminService;
        this.controlsVisible = false;
        this.dragRunning = false;

        this.portalAppService.registerAppLoadedListener(this._appLoadedListener.bind(this));
        this.portalAppService.registerAppAboutToUnloadListener(this._appAboutToUnloadListener.bind(this));
    }

    showPortalAppControls(): void {
        this.portalAppService.loadedPortalApps.forEach((app) => {
            const appWrapper = app.portalAppWrapperElement;
            const parent = appWrapper.parentElement;

            if (app.instanceId && parent?.className.indexOf(CSS_CLASS_APP_CONTROLS) === -1) {
                // No control wrapper yet
                const controlsWrapper = this._createControlsWrapper(app);
                parent.insertBefore(controlsWrapper, appWrapper);
                controlsWrapper.appendChild(appWrapper);
            }
        });

        this.controlsVisible = true;
    }

    hidePortalAppControls(): void {
        Array.from(document.querySelectorAll(`.${CSS_CLASS_APP_CONTROLS}`)).forEach((controlsWrapper) => {
            const appWrapper = controlsWrapper.children[controlsWrapper.children.length - 1];
            const parent = controlsWrapper.parentElement;
            if (parent) {
                parent.insertBefore(appWrapper, controlsWrapper);
                parent.removeChild(controlsWrapper);
            }
        });

        this.controlsVisible = false;
    }

    prepareDrag(event: DragEvent, loadedAppId: string | undefined | null, portalAppName: string, instanceId: string | undefined | null): void {
        this.dragRunning = false;

        // Hint: This doesn't work in IE11, since IE only accept "test" as format
        event.dataTransfer?.setData('portal-app-name', portalAppName);
        if (loadedAppId) {
            event.dataTransfer?.setData('portal-app-id', loadedAppId);
        }
        if (instanceId) {
            event.dataTransfer?.setData('portal-app-instanceId', instanceId);
        }

        // setTimeout() is necessary, otherwise in Chrome a DOM manipulation in the same event stops the drag immediately
        setTimeout(() => {
            this.activatePortalAppDropZones();
            this.dragRunning = true;
        }, 0);
    }

    dragEnd(): void {
        this.dragRunning = false;

        this.deactivatePortalAppDropZones();
    }

    activatePortalAppDropZones(): void {
        this.deactivatePortalAppDropZones();

        Array.from(document.querySelectorAll(`.${CSS_CLASS_MASHROOM_PORTAL_APP_AREA}`)).forEach((areaElem) => {
            const portalAppElements = [];

            for (let i = 0; i < areaElem.childElementCount; i++) {
                const appElem = areaElem.children[i];
                if (appElem.className.indexOf(CSS_CLASS_APP_DROP_ZONE) === -1) {
                    portalAppElements.push(areaElem.children[i]);
                }
            }
            for (let i = 0; i < portalAppElements.length; i++) {
                this._createDropZone(areaElem as HTMLElement, portalAppElements[i] as HTMLElement, i);
            }

            this._createDropZone(areaElem as HTMLElement, null, portalAppElements.length);
        });
    }

    deactivatePortalAppDropZones(): void {
        if (this.dragRunning) {
            return;
        }

        Array.from(document.querySelectorAll(`.${CSS_CLASS_APP_DROP_ZONE}`)).forEach((dropZone) => {
            dropZone.parentElement?.removeChild(dropZone);
        });
    }

    getAppConfigForLoadedApp(portalAppName: string, instanceId: string | undefined | null): any | undefined | null {
        const loadedApp = this.portalAppService.loadedPortalApps.find((la) => la.pluginName === portalAppName && la.instanceId === instanceId);
        if (!loadedApp) {
            return null;
        }
        return loadedApp.appConfig;
    }

    async updateAndReloadApp(loadedAppId: string, portalAppName: string, instanceId: string, areaId: string | undefined | null,
                       dynamic: boolean | undefined | null, position: number | undefined | null, appConfig: any | undefined | null): Promise<void> {
        await this.portalAdminService.updateAppInstance(portalAppName, instanceId, areaId, position, appConfig);
        await this.portalAppService.reloadApp(loadedAppId, appConfig);
    }

    setTrans(t: (key: string) => string) {
        this.trans = t;
    }

    private _onDragOverDropZone(event: DragEvent, dropZone: HTMLElement): void {
        event.preventDefault();

        dropZone.classList.add('drag-over');
    }

    private _onDragLeaveDropZone(event: DragEvent, dropZone: HTMLElement): void {
        dropZone.classList.remove('drag-over');
    }

    private _onDropDropZone(event: DragEvent, areaElement: HTMLElement, position: number) {
        event.preventDefault();

        const id = event.dataTransfer?.getData('portal-app-id');
        const portalAppName = event.dataTransfer?.getData('portal-app-name');
        const instanceId = event.dataTransfer?.getData('portal-app-instanceId');
        console.info('Drop event: ', portalAppName, instanceId, 'Position: ', position);

        if (portalAppName) {
            // Force drag end and remove the drop zone, otherwise the app insert algorithm gets confused
            this.dragEnd();

            this._addApp(id, portalAppName, instanceId, areaElement.id, position);
        }
    }

    private _createDropZone(areaElement: HTMLElement, beforeApp: Node | null, position: number) {
        const dropZone = document.createElement('div');
        dropZone.className = CSS_CLASS_APP_DROP_ZONE;
        dropZone.addEventListener('dragover', (event: DragEvent) => this._onDragOverDropZone(event, dropZone));
        dropZone.addEventListener('dragleave', (event: DragEvent) => this._onDragLeaveDropZone(event, dropZone));
        dropZone.addEventListener('drop', (event: DragEvent) => this._onDropDropZone(event, areaElement, position));

        // console.info('Inserting dropzone before ', beforeApp, position);
        areaElement.insertBefore(dropZone, beforeApp);
    }

    private _createControlsWrapper(app: MashroomPortalLoadedPortalApp) {
        const {editorConfig, errorPluginMissing} = app;

        const controlsWrapper = document.createElement('div');
        controlsWrapper.className = CSS_CLASS_APP_CONTROLS;
        const removeButton = document.createElement('div');
        removeButton.className = 'tool-button remove-button';
        removeButton.title = this.trans('toolRemoveApp');
        const moveButton = document.createElement('div');
        moveButton.className = 'tool-button move-button';
        moveButton.draggable = true;
        moveButton.title = this.trans('toolMoveApp');
        let configureButton;
        if (!errorPluginMissing) {
            configureButton = document.createElement('div');
            configureButton.className = 'tool-button configure-button';
            configureButton.title = this.trans('toolConfigureApp');
        }
        let editButton;
        if (editorConfig) {
            editButton = document.createElement('div');
            editButton.className = 'tool-button edit-button';
            editButton.title = this.trans('toolEditApp');
        }

        controlsWrapper.appendChild(removeButton);
        controlsWrapper.appendChild(moveButton);
        if (configureButton) {
            controlsWrapper.appendChild(configureButton);
        }
        if (editButton) {
            controlsWrapper.appendChild(editButton);
        }

        removeButton.addEventListener('click', this._removeApp.bind(this, app));
        moveButton.addEventListener('dragstart', (e: DragEvent) => this._onMoveAppDragStart(e, app));
        moveButton.addEventListener('dragend', this._onMoveAppDragEnd.bind(this));
        if (configureButton) {
            configureButton.addEventListener('click', this._configureApp.bind(this, app));
        }
        if (editorConfig && editButton) {
            editButton.addEventListener('click', this._editAppContent.bind(this, app));
        }

        return controlsWrapper;
    }

    private async _addApp(loadedAppId: string | undefined | null, portalAppName: string, instanceId: string | undefined | null, areaId: string, position: number) {
        if (instanceId) {
            // Move
            await this.portalAdminService.updateAppInstance(portalAppName, instanceId, areaId, position, null);
            if (loadedAppId) {
                this.portalAppService.moveApp(loadedAppId, areaId, position);
            } else {
                await this.portalAppService.loadApp(areaId, portalAppName, instanceId, position);
            }
        } else {
            // Add
            const addedApp = await this.portalAdminService.addAppInstance(portalAppName, areaId, position);
            await this.portalAppService.loadApp(areaId, portalAppName, addedApp.instanceId, position);
        }
    }

    private _appLoadedListener() {
        if (this.controlsVisible) {
            this.showPortalAppControls();
        }
    }

    private _appAboutToUnloadListener(loadedApp: MashroomPortalLoadedPortalApp) {
        if (this.controlsVisible) {
            const controlsWrapper = loadedApp.portalAppWrapperElement.parentElement;
            if (controlsWrapper?.className === CSS_CLASS_APP_CONTROLS) {
                // Remove controls wrapper
                const parent = controlsWrapper.parentElement;
                if (parent) {
                    parent.insertBefore(loadedApp.portalAppWrapperElement, controlsWrapper);
                    parent.removeChild(controlsWrapper);
                }
            }
        }
    }

    private _removeApp({id, pluginName, instanceId}: MashroomPortalLoadedPortalApp) {
        // Close editor first
        if (id === this.openContentEditorAppId) {
            this._closeAppContentEditor(id);
        }
        this.portalAppService.unloadApp(id);
        this.portalAdminService.removeAppInstance(pluginName, instanceId!);
    }

    private _onMoveAppDragStart(event: DragEvent, {id, pluginName, instanceId}: MashroomPortalLoadedPortalApp) {
        const dragImage = document.createElement('div');
        dragImage.className = 'mashroom-portal-admin-drag-ghost';
        dragImage.innerHTML = `<span>${pluginName}</span>`;
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-100px';
        document.body.appendChild(dragImage);
        event.dataTransfer?.setDragImage(dragImage, 0, 0);

        this.prepareDrag(event, id, pluginName, instanceId);
    }

    private _onMoveAppDragEnd() {
        Array.from(document.querySelectorAll('.mashroom-portal-admin-drag-ghost')).forEach((dragGhost) => {
            document.body.removeChild(dragGhost);
        });

        this.dragEnd();
    }

    private _configureApp({id, pluginName, instanceId, editorConfig}: MashroomPortalLoadedPortalApp) {
        this.store.dispatch(setSelectedPortalApp(id, pluginName, instanceId!, !!editorConfig?.editorPortalApp));
        this.store.dispatch(setShowModal(DIALOG_NAME_PORTAL_APP_CONFIGURE, true));
    }

    private async _editAppContent(loadedPortalApp: MashroomPortalLoadedPortalApp) {
        const {id: appId, instanceId, pluginName, appConfig, editorConfig, portalAppWrapperElement} = loadedPortalApp;
        if (!editorConfig) {
            return;
        }

        if (this.openContentEditorAppId) {
            // A content editor is already open
            if (this.openContentEditorAppId === appId) {
                // Just close and return
                this._closeAppContentEditor(appId);
                return;
            }
            // Close any other open editor
            this._closeAppContentEditor(null);
        }

        const {editorPortalApp, position = 'in-place', appConfig: appConfigEditor = {}} = editorConfig;

        const editorTarget: MashroomPortalConfigEditorTarget = {
            appId,
            pluginName,
            appConfig,
            portalAppWrapperElement,
            updateAppConfig: async (appConfig) => {
                await this.portalAdminService.updateAppInstance(pluginName, instanceId!, null, null, appConfig);
                // @ts-ignore
                loadedPortalApp.appConfig = appConfig;
                if (loadedPortalApp.updateAppConfig) {
                    loadedPortalApp.updateAppConfig(appConfig);
                } else {
                    this.portalAppService.reloadApp(appId);
                }
            },
            close: () => {
                this._closeAppContentEditor(appId);
            },
        };

        const editorAreaId = nanoid(6);
        const editorWrapper = document.createElement('div');
        editorWrapper.className = 'mashroom-portal-app-config-editor';
        editorWrapper.id = editorAreaId;

        if (position === 'sidebar') {
            // sidebar
            const sidebar = document.createElement('div');
            sidebar.className = 'mashroom-portal-app-sidebar';
            const sidebarHost = document.querySelector('main') || document.body;
            sidebarHost.classList.add('mashroom-portal-app-sidebar-host');
            sidebarHost.appendChild(sidebar);
            sidebar.appendChild(editorWrapper);
            try {
                const loadedEditor = await this.portalAppService.loadApp(editorAreaId, editorPortalApp, null, null, {
                    ...appConfigEditor,
                    editorTarget,
                });
                portalAppWrapperElement.parentElement?.classList.add('edit-tool-active');
                sidebarHost.classList.add('editor-open');
                this.setAppContentEditorCb(appId, () => {
                    sidebarHost.classList.remove('editor-open');
                    setTimeout(() => {
                        portalAppWrapperElement.parentElement?.classList.remove('edit-tool-active');
                        sidebarHost.classList.remove('mashroom-portal-app-sidebar-host');
                        this.portalAppService.unloadApp(loadedEditor.id);
                        sidebarHost.removeChild(sidebar);
                    }, 500);
                });
            } catch (e) {
                console.error(`Loading Config Editor for ${pluginName} failed!`, e);
            }
        } else {
            // in-place
            portalAppWrapperElement.appendChild(editorWrapper);
            try {
                const loadedEditor = await this.portalAppService.loadApp(editorAreaId, editorPortalApp, null, null, {
                    ...appConfigEditor,
                    editorTarget,
                });
                portalAppWrapperElement.parentElement?.classList.add('edit-tool-active');
                portalAppWrapperElement.classList.add('editor-open');
                this.setAppContentEditorCb(appId, () => {
                    portalAppWrapperElement.parentElement?.classList.remove('edit-tool-active');
                    portalAppWrapperElement.classList.remove('editor-open');
                    this.portalAppService.unloadApp(loadedEditor.id);
                    portalAppWrapperElement.removeChild(editorWrapper);
                });
            } catch (e) {
                console.error(`Loading Config Editor for ${pluginName} failed!`, e);
            }
        }
    }

    private setAppContentEditorCb(appId: string, cb: () => void) {
        this.openContentEditorAppId = appId;
        this.closeContentEditorCb = cb;
    }

    private _closeAppContentEditor(appId: string | null) {
        if (this.closeContentEditorCb && (appId === null || appId == this.openContentEditorAppId)) {
            this.closeContentEditorCb();
            this.openContentEditorAppId = undefined;
            this.closeContentEditorCb = undefined;
        }
    }
}
