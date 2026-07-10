import {findPluginPackage} from '../utils';
import type {MashroomRemotePackageScannerService} from '@mashroom/mashroom-remote-package-scanner/type-definitions';
import type {Request} from 'express';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types';

export default (req: Request) => async ({ url }: { url: string }): Promise<CallToolResult> => {
    const {pluginContext} = req;
    const {services, loggerFactory} = pluginContext;
    const logger = loggerFactory('mashroom.mcp');
    const remoteScannerService = services.remotePackageScanner?.service as MashroomRemotePackageScannerService | undefined;

    logger.info('Executing unregister-remote-portal-app');

    if (!remoteScannerService) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Error: This tool only works if the plugin @mashroom/mashroom-remote-package-scanner is installed.',
                },
            ],
        };
    }

    let targetURL: URL | undefined;
    try {
        targetURL = new URL(url);
    } catch (e: any) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: Invalid url ${url}. Error: ${e.message}.`,
                },
            ],
        };
    }

    if (!targetURL.protocol.startsWith('http')) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Error: Invalid protocol, only http and https supported!',
                },
            ],
        };
    }

    // Check if the package is actually registered
    const registeredPackage = findPluginPackage(targetURL, pluginContext);
    if (!registeredPackage) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: The URL ${url} is not registered at the moment!`,
                },
            ],
        };
    }

    remoteScannerService.removePackageUrl(req, targetURL);

    return {
        content: [
            {
                type: 'text',
                text: `Success. The following Apps have been unregistered: ${registeredPackage.foundPlugins?.join(', ')}`,
            },
        ],
    };
};
