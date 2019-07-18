// @flow

import path from 'path';
import fs from 'fs';
import fsExtra from 'fs-extra';
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import MashroomWebAppPluginLoader from '../../../src/plugins/loader/MashroomWebAppPluginLoader';
import MashroomPlugin from '../../../src/plugins/MashroomPlugin';

const getPluginPackageFolder = () => {
    const packageFolder = path.resolve(__dirname, '../../../test-data/loader1/test-package');
    fsExtra.emptyDirSync(packageFolder);
    return packageFolder;
};

let expressStack = [];
const expressUseMock = jest.fn();
const ExpressApplicationMock: any = jest.fn(() => ({
    use: expressUseMock,
    _router: {
        stack: expressStack,
    },
}));

const RegistryConnectorMock: any = jest.fn(() => ({
    on: () => {},
}));

describe('MashroomWebAppPluginLoader', () => {

    beforeEach(() => {
        expressUseMock.mockReset();
    });

    it('loads a web-app to a given path', async () => {
        const pluginPackagePath = getPluginPackageFolder();
        let expressHandler = null;

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

        const plugin = new MashroomPlugin(pluginDefinition, pluginPackage, new RegistryConnectorMock(), dummyLoggerFactory);

        fs.writeFileSync(path.resolve(pluginPackagePath, pluginDefinition.bootstrap), `
            module.exports = () => (req, res, next) => req.test = 1;
        `);

        const context: any = {};

        const loader = new MashroomWebAppPluginLoader(new ExpressApplicationMock(), dummyLoggerFactory);
        await loader.load(plugin, {path: '/foo'}, context);

        expect(loader._loadedPlugins.size).toBe(1);

        expect(expressHandler).toBeTruthy();
        if (expressHandler) {
            const req = {};
            expressHandler(req);
            expect(req.test).toBe(1);
        }
    });

    it('reloads a web-app', async () => {
        const pluginPackagePath = getPluginPackageFolder();
        let reloadedWebapp = null;

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

        const plugin = new MashroomPlugin(pluginDefinition, pluginPackage, new RegistryConnectorMock(), dummyLoggerFactory);

        fs.writeFileSync(path.resolve(pluginPackagePath, pluginDefinition.bootstrap), `
            module.exports = () => (req, res, next) => req.test = 3;
        `);

        const requestHandlerWrapper: any = {
            updateRequestHandler(webapp) {
                reloadedWebapp = webapp;
            },
        };

        const context: any = {};

        const loader = new MashroomWebAppPluginLoader(new ExpressApplicationMock(), dummyLoggerFactory);
        loader._loadedPlugins.set('Test2', {
            path: '/foo',
            requestHandlerWrapper,
        });

        await loader.load(plugin, {path: '/foo'}, context);

        expect(loader._loadedPlugins.size).toBe(1);

        expect(reloadedWebapp).toBeTruthy();
        if (reloadedWebapp) {
            const req = {};
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

        const plugin = new MashroomPlugin(pluginDefinition, pluginPackage, new RegistryConnectorMock(), dummyLoggerFactory);
        const requestHandlerWrapper: any = {};

        expressStack = [
            {name: 'foo'},
            {name: 'Test3'},
            {name: 'bar'},
        ];

        const loader = new MashroomWebAppPluginLoader(new ExpressApplicationMock(), dummyLoggerFactory);
        loader._loadedPlugins.set('Test3', {
            path: '/foo',
            requestHandlerWrapper,
        });

        loader.unload(plugin);

        expect(loader._loadedPlugins.size).toBe(0);
        expect(expressStack.length).toBe(2);
        expect(expressStack.find((e) => e.name === 'Test3')).toBeFalsy();
    });


});
