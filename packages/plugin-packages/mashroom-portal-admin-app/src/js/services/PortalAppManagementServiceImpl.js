// @flow

import {setShowModal} from '@mashroom/mashroom-portal-ui-commons';
import {setSelectedPortalApp} from '../store/actions';
import {
    CSS_CLASS_MASHROOM_PORTAL_APP_AREA,
    CSS_CLASS_APP_CONTROLS,
    CSS_CLASS_APP_DROP_ZONE,
    DIALOG_NAME_PORTAL_APP_CONFIGURE,
} from '../constants';

import type {MashroomPortalAppService, MashroomPortalAdminService, MashroomPortalLoadedPortalApp} from '@mashroom/mashroom-portal/type-definitions';
import type {
    Store, PortalAppManagementService,
} from '../../../type-definitions';

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

    showPortalAppControls() {
        this.portalAppService.loadedPortalApps.forEach((app) => {
            const appWrapper = app.portalAppWrapperElement;
            const parent = appWrapper.parentElement;

            if (app.instanceId && parent && parent.className.indexOf(CSS_CLASS_APP_CONTROLS) === -1) {
                // No control wrapper yet
                const controlsWrapper = this._createControlsWrapper(app.id, app.pluginName, app.instanceId);
                parent.insertBefore(controlsWrapper, appWrapper);
                controlsWrapper.appendChild(appWrapper);
            }
        });

        this.controlsVisible = true;
    }

    hidePortalAppControls() {
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

    prepareDrag(event: DragEvent, loadedAppId: ?string, portalAppName: string, instanceId: ?string) {
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

    dragEnd() {
        this.dragRunning = false;

        this.deactivatePortalAppDropZones();
    }

    activatePortalAppDropZones() {
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
                this._createDropZone(areaElem, portalAppElements[i], i);
            }

            this._createDropZone(areaElem, null, portalAppElements.length);
        });
    }

    deactivatePortalAppDropZones() {
        if (this.dragRunning) {
            return;
        }

        Array.from(document.querySelectorAll(`.${CSS_CLASS_APP_DROP_ZONE}`)).forEach((dropZone) => {
            dropZone.parentElement && dropZone.parentElement.removeChild(dropZone);
        });
    }

    getAppConfigForLoadedApp(portalAppName: string, instanceId: ?string) {
        const loadedApp = this.portalAppService.loadedPortalApps.find((la) => la.pluginName === portalAppName && la.instanceId === instanceId);
        if (!loadedApp) {
            return null;
        }
        return loadedApp.appConfig;
    }

    updateAndReloadApp(loadedAppId: string, portalAppName: string, instanceId: string, areaId: ?string, dynamic: ?boolean, position: ?number, appConfig: ?any) {
        return this.portalAdminService.updateAppInstance(portalAppName, instanceId, areaId, position, appConfig).then(
            () => {
                this.portalAppService.reloadApp(loadedAppId);
                return Promise.resolve();
            }
        );
    }

    _onDragOverDropZone(event: DragEvent, dropZone: HTMLElement) {
        event.preventDefault();

        dropZone.classList.add('drag-over');
    }

    _onDragLeaveDropZone(event: DragEvent, dropZone: HTMLElement) {
        dropZone.classList.remove('drag-over');
    }

    _onDropDropZone(event: DragEvent, areaElement: HTMLElement, position: number) {
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

    _createDropZone(areaElement: HTMLElement, beforeApp: ?HTMLElement, position: number) {
        const dropZone = document.createElement('div');
        dropZone.className = CSS_CLASS_APP_DROP_ZONE;
        dropZone.addEventListener('dragover', (event: DragEvent) => this._onDragOverDropZone(event, dropZone));
        dropZone.addEventListener('dragleave', (event: DragEvent) => this._onDragLeaveDropZone(event, dropZone));
        dropZone.addEventListener('drop', (event: DragEvent) => this._onDropDropZone(event, areaElement, position));

        // console.info('Inserting dropzone before ', beforeApp, position);
        areaElement.insertBefore(dropZone, beforeApp);
    }

    _createControlsWrapper(loadedAppId: string, portalAppName: string, instanceId: string) {
        const controlsWrapper = document.createElement('div');
        controlsWrapper.className = CSS_CLASS_APP_CONTROLS;
        const removeButton = document.createElement('div');
        removeButton.className = 'tool-button remove-button';
        const moveButton = document.createElement('div');
        moveButton.className = 'tool-button move-button';
        moveButton.draggable = true;
        const configureButton = document.createElement('div');
        configureButton.className = 'tool-button configure-button';
        controlsWrapper.appendChild(removeButton);
        controlsWrapper.appendChild(moveButton);
        controlsWrapper.appendChild(configureButton);

        removeButton.addEventListener('click', this._removeApp.bind(this, loadedAppId, portalAppName, instanceId));
        moveButton.addEventListener('dragstart', (e: DragEvent) => this._onMoveAppDragStart(e, loadedAppId, portalAppName, instanceId));
        moveButton.addEventListener('dragend', this._onMoveAppDragEnd.bind(this));
        configureButton.addEventListener('click', this._configureApp.bind(this, loadedAppId, portalAppName, instanceId));

        return controlsWrapper;
    }

    _addApp(loadedAppId: ?string, portalAppName: string, instanceId: ?string, areaId: string, position: number) {
        if (instanceId) {
            // Move
            this.portalAdminService.updateAppInstance(portalAppName, instanceId, areaId, position).then(
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

    _appLoadedListener() {
        if (this.controlsVisible) {
            this.showPortalAppControls();
        }
    }

    _appAboutToUnloadListener(loadedApp: MashroomPortalLoadedPortalApp) {
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

    _removeApp(id: string, portalAppName: string, instanceId: string) {
        this.portalAppService.unloadApp(id);
        this.portalAdminService.removeAppInstance(portalAppName, instanceId);
    }

    _onMoveAppDragStart(event: DragEvent, loadedAppId: string, portalAppName: string, instanceId: ?string) {
        const dragImage = document.createElement('div');
        dragImage.className = 'mashroom-portal-admin-drag-ghost';
        dragImage.innerHTML = `<span>${portalAppName}</span>`;
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-100px';
        document.body && document.body.appendChild(dragImage);
        event.dataTransfer && event.dataTransfer.setDragImage(dragImage, 0, 0);

        this.prepareDrag(event, loadedAppId, portalAppName, instanceId);
    }

    _onMoveAppDragEnd(event: DragEvent) {
        Array.from(document.querySelectorAll('.drag-ghost')).forEach((dragGhost) => {
            document.body && document.body.removeChild(dragGhost);
        });

        this.dragEnd();
    }

    _configureApp(loadedAppId: string, portalAppName: string, instanceId: ?string) {
        this.store.dispatch(setSelectedPortalApp(loadedAppId, portalAppName, instanceId));
        this.store.dispatch(setShowModal(DIALOG_NAME_PORTAL_APP_CONFIGURE, true));
    }
}
