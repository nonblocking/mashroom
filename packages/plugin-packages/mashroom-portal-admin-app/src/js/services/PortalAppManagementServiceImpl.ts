
import {nanoid} from 'nanoid';
import {setShowModal} from '@mashroom/mashroom-portal-ui-commons';
import {setSelectedPortalApp} from '../store/actions';
import {
    CSS_CLASS_MASHROOM_PORTAL_APP_AREA,
    CSS_CLASS_APP_CONTROLS,
    CSS_CLASS_APP_DROP_ZONE,
    DIALOG_NAME_PORTAL_APP_CONFIGURE,
} from '../constants';
import {currentMessages} from '../messages';

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
    dragRunning: boolean;

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

            if (app.instanceId && parent && parent.className.indexOf(CSS_CLASS_APP_CONTROLS) === -1) {
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
        event.dataTransfer && event.dataTransfer.setData('portal-app-name', portalAppName);
        if (loadedAppId) {
            event.dataTransfer && event.dataTransfer.setData('portal-app-id', loadedAppId);
        }
        if (instanceId) {
            event.dataTransfer && event.dataTransfer.setData('portal-app-instanceId', instanceId);
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
            dropZone.parentElement && dropZone.parentElement.removeChild(dropZone);
        });
    }

    getAppConfigForLoadedApp(portalAppName: string, instanceId: string | undefined | null): any | undefined | null {
        const loadedApp = this.portalAppService.loadedPortalApps.find((la) => la.pluginName === portalAppName && la.instanceId === instanceId);
        if (!loadedApp) {
            return null;
        }
        return loadedApp.appConfig;
    }

    updateAndReloadApp(loadedAppId: string, portalAppName: string, instanceId: string, areaId: string | undefined | null,
                       dynamic: boolean | undefined | null, position: number | undefined | null, appConfig: any | undefined | null): Promise<void> {
        return this.portalAdminService.updateAppInstance(portalAppName, instanceId, areaId, position, appConfig).then(
            () => {
                this.portalAppService.reloadApp(loadedAppId);
                return Promise.resolve();
            }
        );
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

        const id = event.dataTransfer && event.dataTransfer.getData('portal-app-id');
        const portalAppName = event.dataTransfer && event.dataTransfer.getData('portal-app-name');
        const instanceId = event.dataTransfer && event.dataTransfer.getData('portal-app-instanceId');
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
        const {editorConfig} = app;

        const controlsWrapper = document.createElement('div');
        controlsWrapper.className = CSS_CLASS_APP_CONTROLS;
        const removeButton = document.createElement('div');
        removeButton.className = 'tool-button remove-button';
        removeButton.title = currentMessages.toolRemoveApp;
        const moveButton = document.createElement('div');
        moveButton.className = 'tool-button move-button';
        moveButton.draggable = true;
        moveButton.title = currentMessages.toolMoveApp;
        const configureButton = document.createElement('div');
        configureButton.className = 'tool-button configure-button';
        configureButton.title = currentMessages.toolConfigureApp;
        let editButton;
        if (editorConfig) {
            editButton = document.createElement('div');
            editButton.className = 'tool-button edit-button';
            editButton.title = currentMessages.toolEditApp;
        }

        controlsWrapper.appendChild(removeButton);
        controlsWrapper.appendChild(moveButton);
        controlsWrapper.appendChild(configureButton);
        if (editButton) {
            controlsWrapper.appendChild(editButton);
        }

        removeButton.addEventListener('click', this._removeApp.bind(this, app));
        moveButton.addEventListener('dragstart', (e: DragEvent) => this._onMoveAppDragStart(e, app));
        moveButton.addEventListener('dragend', this._onMoveAppDragEnd.bind(this));
        configureButton.addEventListener('click', this._configureApp.bind(this, app));
        if (editorConfig && editButton) {
            editButton.addEventListener('click', this._editAppContent.bind(this, app));
        }

        return controlsWrapper;
    }

    private _addApp(loadedAppId: string | undefined | null, portalAppName: string, instanceId: string | undefined | null, areaId: string, position: number) {
        if (instanceId) {
            // Move
            this.portalAdminService.updateAppInstance(portalAppName, instanceId, areaId, position, null).then(
                () => {
                    if (loadedAppId) {
                        this.portalAppService.moveApp(loadedAppId, areaId, position);
                    } else {
                        this.portalAppService.loadApp(areaId, portalAppName, instanceId, position);
                    }
                }
            );
        } else {
            // Add
            this.portalAdminService.addAppInstance(portalAppName, areaId, position).then(
                (addedApp) => {
                    this.portalAppService.loadApp(areaId, portalAppName, addedApp.instanceId, position);
                }
            );
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
            if (controlsWrapper && controlsWrapper.className === CSS_CLASS_APP_CONTROLS) {
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
        this.portalAppService.unloadApp(id);
        this.portalAdminService.removeAppInstance(pluginName, instanceId!);
    }

    private _onMoveAppDragStart(event: DragEvent, {id, pluginName, instanceId}: MashroomPortalLoadedPortalApp) {
        const dragImage = document.createElement('div');
        dragImage.className = 'mashroom-portal-admin-drag-ghost';
        dragImage.innerHTML = `<span>${pluginName}</span>`;
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-100px';
        document.body && document.body.appendChild(dragImage);
        event.dataTransfer && event.dataTransfer.setDragImage(dragImage, 0, 0);

        this.prepareDrag(event, id, pluginName, instanceId);
    }

    private _onMoveAppDragEnd() {
        Array.from(document.querySelectorAll('.drag-ghost')).forEach((dragGhost) => {
            document.body && document.body.removeChild(dragGhost);
        });

        this.dragEnd();
    }

    private _configureApp({id, pluginName, instanceId, editorConfig}: MashroomPortalLoadedPortalApp) {
        this.store.dispatch(setSelectedPortalApp(id, pluginName, instanceId!, !!editorConfig?.editorPortalApp));
        this.store.dispatch(setShowModal(DIALOG_NAME_PORTAL_APP_CONFIGURE, true));
    }

    private _editAppContent(loadedPortalApp: MashroomPortalLoadedPortalApp) {
        const {id: appId, instanceId, pluginName, appConfig, editorConfig, portalAppWrapperElement, portalAppHostElement} = loadedPortalApp;
        if (!editorConfig) {
            return;
        }

        const {editorPortalApp, position = 'in-place', appConfig: appConfigEditor = {}} = editorConfig;

        let closeEditor = () => { /* dummy */ };
        const editorTarget: MashroomPortalConfigEditorTarget = {
            appId,
            pluginName,
            appConfig,
            updateAppConfig: (appConfig) => {
                return this.portalAdminService.updateAppInstance(pluginName, instanceId!, null, null, appConfig).then(
                    () => {
                        // @ts-ignore
                        loadedPortalApp.appConfig = appConfig;
                        if (loadedPortalApp.updateAppConfig) {
                            loadedPortalApp.updateAppConfig(appConfig);
                        } else {
                            this.portalAppService.reloadApp(appId);
                        }
                    }
                );
            },
            close: () => {
                closeEditor();
            },
        };

        const editorAreaId = nanoid(6);
        const editorWrapper = document.createElement('div');
        editorWrapper.className = 'mashroom-portal-app-config-editor';
        editorWrapper.id = editorAreaId;

        if (position === 'sidebar') {
            if (document.querySelector('.mashroom-portal-app-sidebar')) {
                // Editor already open
                return;
            }

            // sidebar
            const sidebar = document.createElement('div');
            sidebar.className = 'mashroom-portal-app-sidebar';
            const sidebarHost = document.querySelector('main') || document.body;
            sidebarHost.classList.add('mashroom-portal-app-sidebar-host');
            sidebarHost.appendChild(sidebar);
            sidebar.appendChild(editorWrapper);
            this.portalAppService.loadApp(editorAreaId, editorPortalApp, null, null, {
                ...appConfigEditor,
                editorTarget,
            }).then(
                (loadedEditor) => {
                    sidebarHost.classList.add('editor-open');
                    closeEditor = () => {
                        sidebarHost.classList.remove('editor-open');
                        setTimeout(() => {
                            sidebarHost.classList.remove('mashroom-portal-app-sidebar-host');
                            this.portalAppService.unloadApp(loadedEditor.id);
                            sidebarHost.removeChild(sidebar);
                        }, 500);
                    }
                },
                (error) => {
                    console.error(`Loading Config Editor for ${pluginName} failed!`, error);
                }
            )

        } else {
            // in-place
            if (portalAppWrapperElement.querySelector('.mashroom-portal-app-config-editor')) {
                // Editor already open
                return;
            }

            portalAppWrapperElement.appendChild(editorWrapper);
            this.portalAppService.loadApp(editorAreaId, editorPortalApp, null, null, {
                ...appConfigEditor,
                editorTarget,
            }).then(
                (loadedEditor) => {
                    portalAppWrapperElement.classList.add('editor-open');
                    closeEditor = () => {
                        portalAppWrapperElement.classList.remove('editor-open');
                        this.portalAppService.unloadApp(loadedEditor.id);
                        portalAppWrapperElement.removeChild(editorWrapper);
                    }
                },
                (error) => {
                    console.error(`Loading Config Editor for ${pluginName} failed!`, error);
                }
            )
        }
    }
}
