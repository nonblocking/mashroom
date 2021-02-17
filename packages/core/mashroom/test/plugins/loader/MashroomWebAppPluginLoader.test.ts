
import path from 'path';
import fs from 'fs';
import fsExtra from 'fs-extra';
import {dummyLoggerFactory as loggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import MashroomWebAppPluginLoader from '../../../src/plugins/loader/MashroomWebAppPluginLoader';
import MashroomPlugin from '../../../src/plugins/MashroomPlugin';

const getPluginPackageFolder = () => {
    const packageFolder = path.resolve(__dirname, '../../../test-data/loader1/test-package');
    fsExtra.emptyDirSync(packageFolder);
    return packageFolder;
};

let expressStack: Array<any> = [];
const expressUseMock = jest.fn();
const ExpressApplicationMock: any = jest.fn(() => ({
    use: expressUseMock,
    _router: {
        stack: expressStack,
    },
}));

let upgradeHandler: any = null;
const httpServerMock: any = {
    on(event: string, handler: (req: any, socket: any, head: any) => void) {
        if (event === 'upgrade') {
            upgradeHandler = handler;
        }
    }
};

const pluginContextHolderMock = {
    getPluginContext() {
        const context: any = {
            loggerFactory,
            foo: 'bar'
        };
        return context;
    }
};

const RegistryConnectorMock: any = jest.fn(() => ({
    on: () => { /* nothing to do */ },
}));

describe('MashroomWebAppPluginLoader', () => {

    beforeEach(() => {
        expressUseMock.mockReset();
    });

    it('loads a web-app to a given path', async () => {
        const pluginPackagePath = getPluginPackageFolder();
        let expressHandler: any = null;

        expressUseMock.mockImplementation((path, handler) => {
            expect(path).toBe('/foo');
            expressHandler = handler;
        });

        const pluginDefinition: any = {
            bootstrap: 'bootstrap.js',
            name: 'Test1',
            type: 'web-app',
            defaultConfig: {
                path: '/foo',
            },
        };

        const pluginPackage: any = {
            pluginPackagePath,
        };

        const plugin = new MashroomPlugin(pluginDefinition, pluginPackage, new RegistryConnectorMock(), loggerFactory);

        fs.writeFileSync(path.resolve(pluginPackagePath, pluginDefinition.bootstrap), `
            module.exports = () => (req, res, next) => req.test = 1;
        `);

        const context: any = {};

        const loader = new MashroomWebAppPluginLoader(new ExpressApplicationMock(), httpServerMock, loggerFactory, pluginContextHolderMock);
        await loader.load(plugin, {path: '/foo'}, context);

        // @ts-ignore
        expect(loader._loadedPlugins.size).toBe(1);

        expect(expressHandler).toBeTruthy();
        if (expressHandler) {
            const req: any = {};
            expressHandler(req);
            expect(req.test).toBe(1);
        }
    });

    it('reloads a web-app', async () => {
        const pluginPackagePath = getPluginPackageFolder();
        let reloadedWebapp: any = null;

        const pluginDefinition: any = {
            bootstrap: 'bootstrap2.js',
            name: 'Test2',
            type: 'web-app',
            defaultConfig: {
                path: '/foo',
            },
        };

        const pluginPackage: any = {
            pluginPackagePath,
        };

        const plugin = new MashroomPlugin(pluginDefinition, pluginPackage, new RegistryConnectorMock(), loggerFactory);

        fs.writeFileSync(path.resolve(pluginPackagePath, pluginDefinition.bootstrap), `
            module.exports = () => (req, res, next) => req.test = 3;
        `);

        const requestHandlerWrapper: any = {
            updateRequestHandler(webapp: any) {
                reloadedWebapp = webapp;
            },
        };

        const context: any = {};

        const loader = new MashroomWebAppPluginLoader(new ExpressApplicationMock(), httpServerMock, loggerFactory, pluginContextHolderMock);
        // @ts-ignore
        loader._loadedPlugins.set('Test2', {
            path: '/foo',
            requestHandlerWrapper,
        });

        await loader.load(plugin, {path: '/foo'}, context);

        // @ts-ignore
        expect(loader._loadedPlugins.size).toBe(1);

        expect(reloadedWebapp).toBeTruthy();
        if (reloadedWebapp) {
            const req: any = {};
            reloadedWebapp(req);
            expect(req.test).toBe(3);
        }
    });

    it('removes a web-app', () => {
        const pluginPackagePath = getPluginPackageFolder();

        const pluginDefinition: any = {
            bootstrap: 'bootstrap2.js',
            name: 'Test3',
            type: 'web-app',
            defaultConfig: {
                path: '/foo',
            },
        };

        const pluginPackage: any = {
            pluginPackagePath,
        };

        const plugin = new MashroomPlugin(pluginDefinition, pluginPackage, new RegistryConnectorMock(), loggerFactory);
        const requestHandlerWrapper: any = {};

        expressStack = [
            {name: 'foo'},
            {name: 'Test3'},
            {name: 'bar'},
        ];

        const loader = new MashroomWebAppPluginLoader(new ExpressApplicationMock(), httpServerMock, loggerFactory, pluginContextHolderMock);
        // @ts-ignore
        loader._loadedPlugins.set('Test3', {
            path: '/foo',
            requestHandlerWrapper,
        });

        loader.unload(plugin);

        // @ts-ignore
        expect(loader._loadedPlugins.size).toBe(0);
        expect(expressStack.length).toBe(2);
        expect(expressStack.find((e) => e.name === 'Test3')).toBeFalsy();
    });

    it('loads a web-app with a HTTP upgrade handler correctly', async () => {
        const pluginPackagePath = getPluginPackageFolder();

        const pluginDefinition: any = {
            bootstrap: 'bootstrap4.js',
            name: 'Test4',
            type: 'web-app',
            defaultConfig: {
                path: '/websocket',
            },
        };

        const pluginPackage: any = {
            pluginPackagePath,
        };

        const plugin = new MashroomPlugin(pluginDefinition, pluginPackage, new RegistryConnectorMock(), loggerFactory);

        fs.writeFileSync(path.resolve(pluginPackagePath, pluginDefinition.bootstrap), `
            module.exports = () => ({
                expressApp: (req, res, next) => req.test = 1,
                upgradeHandler: (req, socket, head) => socket.test = 2,
            })
        `);

        const context: any = {};

        const loader = new MashroomWebAppPluginLoader(new ExpressApplicationMock(), httpServerMock, loggerFactory, pluginContextHolderMock);
        await loader.load(plugin, {path: '/websocket'}, context);

        // @ts-ignore
        expect(loader._loadedPlugins.size).toBe(1);
        // @ts-ignore
        expect(loader._upgradeHandlers.length).toBe(1);

        expect(upgradeHandler).toBeTruthy();
        if (upgradeHandler) {
            const req: any = {
                headers: {},
                url: '/websocket/test'
            };
            const socket: any = {};
            upgradeHandler(req, socket, {});
            expect(socket.test).toBe(2);
        }
    });

});
