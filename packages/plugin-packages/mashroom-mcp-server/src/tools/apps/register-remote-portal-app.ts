import {findPluginPackage} from '../utils';
import type {Request} from 'express';
import type {MashroomRemotePackageScannerService} from '@mashroom/mashroom-remote-package-scanner/type-definitions';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types';

const WAIT_FOR_REGISTRATION_SUCCESS_SEC_DEFAULT = 20;

export default (req: Request) => async ({ url, waitForSec = WAIT_FOR_REGISTRATION_SUCCESS_SEC_DEFAULT }: { url: string, waitForSec?: number }): Promise<CallToolResult> => {
    const {pluginContext} = req;
    const {services, loggerFactory} = pluginContext;
    const logger = loggerFactory('mashroom.mcp');
    const remoteScannerService = services.remotePackageScanner?.service as MashroomRemotePackageScannerService | undefined;

    logger.info('Executing register-remote-portal-app');

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

    // Check if the package is already registered
    const alreadyRegisteredPackage = findPluginPackage(targetURL, pluginContext);
    if (alreadyRegisteredPackage) {
        let statusText = alreadyRegisteredPackage.foundPlugins?.length ? `the following Apps have been found: ${alreadyRegisteredPackage.foundPlugins.join(', ')}` : 'no Apps have been found';
        if (alreadyRegisteredPackage.updateErrors?.length) {
            statusText += ` and the following errors occurred: ${alreadyRegisteredPackage.updateErrors.join(', ')}`;
        }
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: The URL ${url} is already registered and ${statusText}.`,
                },
            ],
        };
    }

    try {
        const start = Date.now();
        await remoteScannerService.addOrUpdatePackageUrl(req, new URL(url));

        let newlyRegisteredPluginPackage;
        while (!newlyRegisteredPluginPackage?.foundPlugins?.length && Date.now() - start < waitForSec * 1000) {
            newlyRegisteredPluginPackage = findPluginPackage(targetURL, pluginContext);
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        if (newlyRegisteredPluginPackage?.foundPlugins?.length) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Success. The following new Apps have been registered: ${newlyRegisteredPluginPackage.foundPlugins.join(', ')}`,
                    },
                ],
            };
        } else {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error: No new Apps registered on URL ${url} after ${waitForSec} seconds!`,
                    },
                ],
            };
        }

    } catch (e: any) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: Registering the URL failed with: ${e.message}`,
                },
            ],
        };
    }
};
