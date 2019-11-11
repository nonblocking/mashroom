// @flow

import ResourceManager from '../../../src/frontend/portal-client/js/ResourceManager';

describe('ResourceManager', () => {

    const mockRemoteLogger: any = console;
    let loadEventListeners = [];
    let errorEventListeners= [];
    let createdElements = [];
    let appendedToHead = false;
    let elementRemoved = false;
    let mockHtmlDoc: any = {
        head: {
            appendChild: () => appendedToHead = true,
        },
        createElement: () =>  {
            const createdElement = {
                src: null,
                addEventListener: (type, listener) => {
                    switch (type) {
                        case 'load':
                            loadEventListeners.push(listener);
                            break;
                        case 'error':
                            errorEventListeners.push(listener);
                            break;
                        default:
                            break;
                    }
                },
                parentElement: {
                    removeChild: () => elementRemoved = true,
                },
            };
            createdElements.push(createdElement);
            return createdElement;
        }
    };

    beforeEach(() => {
        createdElements = [];
        appendedToHead = false;
        elementRemoved = false;
        loadEventListeners = [];
        errorEventListeners = [];
    });

    it('adds a JS resources', (done) => {
        const resourceManager = new ResourceManager(mockRemoteLogger, mockHtmlDoc);

        const portalAppRef: any = {};
        resourceManager.loadJs('bundle.js', portalAppRef).then(
            () => {
                done();
            }
        );

        expect(createdElements.length).toBe(1);
        expect(createdElements[0].src).toBe('bundle.js');
        expect(appendedToHead).toBeTruthy();
        expect(loadEventListeners.length).toBe(1);
        expect(errorEventListeners.length).toBe(1);

        loadEventListeners[0]();
    });

    it('adds a resource only once', () => {
        const resourceManager = new ResourceManager(mockRemoteLogger, mockHtmlDoc);

        const portalAppRef: any = {};
        resourceManager.loadJs('bundle2.js', portalAppRef);

        loadEventListeners[0]();

        resourceManager.loadJs('bundle2.js', portalAppRef);

        expect(createdElements.length).toBe(1);
        expect(appendedToHead).toBeTruthy();
        expect(loadEventListeners.length).toBe(1);
        expect(errorEventListeners.length).toBe(1);
    });

    it('adds a resource only once even when not loaded yet', (done) => {
        const resourceManager = new ResourceManager(mockRemoteLogger, mockHtmlDoc);

        const portalAppRef: any = {};
        resourceManager.loadJs('bundle3.js', portalAppRef);
        resourceManager.loadJs('bundle3.js', portalAppRef).then(
            () => {
                done();
            }
        );


        expect(createdElements.length).toBe(1);
        expect(appendedToHead).toBeTruthy();
        expect(loadEventListeners.length).toBe(1);
        expect(errorEventListeners.length).toBe(1);

        loadEventListeners[0]();
    });

    it('removes only resource no longer referenced by an app', () => {
        const resourceManager = new ResourceManager(mockRemoteLogger, mockHtmlDoc);

        const portalAppRef1: any = {};
        const portalAppRef2: any = {};
        resourceManager.loadJs('bundle4.js', portalAppRef1);
        loadEventListeners[0]();
        resourceManager.loadJs('bundle4.js', portalAppRef2);
        resourceManager.loadJs('bundle4.js', portalAppRef2);

        resourceManager.unloadAppResources(portalAppRef1);
        expect(elementRemoved).toBeFalsy();

        resourceManager.unloadAppResources(portalAppRef2);
        expect(elementRemoved).toBeTruthy();
    });



});
