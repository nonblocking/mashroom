import context from '../../context';
import getRemotePluginPackageEndpointStore from '../../store/getRemotePluginPackageEndpointStore';
import {SCANNER_NAME} from '../../scanner/RemotePluginPackagesScanner';
import type {Request, Response} from 'express';
import type {MashroomCSRFService} from '@mashroom/mashroom-csrf-protection/type-definitions';

const renderAdminPage = async (req: Request, res: Response, errorMessage?: string) => {
    const pluginService = req.pluginContext.services.core.pluginService;
    const csrfService: MashroomCSRFService = req.pluginContext.services.csrf?.service;
    const store = await getRemotePluginPackageEndpointStore(req.pluginContext);
    const {result: remotePackageEndpoints} = await store.find();
    const pluginPackages = pluginService.getPotentialPluginPackagesByScanner(SCANNER_NAME);

    const endpoints = [...remotePackageEndpoints]
        .sort((e1, e2) => {
            return e1.url.localeCompare(e2.url);
        })
        .map((endpoint) => {
            const pluginPackage = pluginPackages.find((p) => p.url.toString() === new URL(endpoint.url).toString());
            let status = 'Unknown';
            let statusClass = 'pending';
            if (pluginPackage) {
                status = pluginPackage.processedOnce ? pluginPackage.status : 'pending';
                if (pluginPackage.updateErrors) {
                    status ='Error';
                    statusClass = 'error';
                } else if (pluginPackage.status === 'processing') {
                    status = 'Processing';
                    statusClass = 'processing';
                } else {
                    status = 'Processed';
                    statusClass = 'processed';
                }
            }
            return {
                url: endpoint.url,
                status,
                statusClass,
                rowClass: pluginPackage?.updateErrors ? 'row-error' : '',
                foundPlugins: pluginPackage?.foundPlugins,
                errors: pluginPackage?.updateErrors ? pluginPackage.updateErrors.join(', ') : '',
            };
        });

    res.render('admin', {
        baseUrl: req.baseUrl,
        showAddRemotePluginPackageForm: context.showAddRemotePluginPackageForm,
        endpoints,
        errorMessage,
        csrfToken: csrfService ? csrfService.getCSRFToken(req) : null
    });
};

export const adminIndex = async (req: Request, res: Response) => {
    await renderAdminPage(req, res);
};

export const adminUpdate = async (req: Request, res: Response) => {
    const logger = req.pluginContext.loggerFactory('mashroom.scanner.remotePackage');
    const store = await getRemotePluginPackageEndpointStore(req.pluginContext);

    const action = req.body._action || 'add';
    const rawURL = req.body._url;

    let url;
    let protocol;
    try {
        const parsedURL = new URL(rawURL);
        url = parsedURL.toString();
        protocol = parsedURL.protocol;
    } catch (e) {
        const errorMessage = 'Error: Invalid URL';
        await renderAdminPage(req, res, errorMessage);
        return;
    }
    if (protocol !== 'http:' && protocol !== 'https:') {
        const errorMessage = 'Error: Invalid protocol (only HTTP and HTTPS are supported)';
        await renderAdminPage(req, res, errorMessage);
        return;
    }

    const existingEndpoint = url && await store.findOne({ url });

    if (action === 'add') {
        if (!url || url === '') {
            const errorMessage = 'Error: Invalid URL';
            await renderAdminPage(req, res, errorMessage);
            return;
        } else if (!existingEndpoint) {
            logger.info(`Adding plugin package endpoint: ${url}`);
            try {
                await store.insertOne({
                    url,
                    lastRefreshTimestamp: Date.now(),
                });
                context.scannerCallback?.addOrUpdatePackageURL(new URL(url));
            } catch (error: any) {
                logger.error('Adding endpoint failed', error);
                const errorMessage = `Error: Adding endpoint failed: ${error.message}`;
                await renderAdminPage(req, res, errorMessage);
                return;
            }
        }
    } else if (action === 'refresh') {
        if (existingEndpoint) {
            logger.info(`Refreshing plugin package endpoint: ${url}`);
            try {
                context.scannerCallback?.addOrUpdatePackageURL(new URL(url));
            } catch (error: any) {
                logger.error('Refreshing endpoint failed', error);
            }
        }
    } else if (action === 'delete') {
        if (existingEndpoint) {
            logger.info(`Removing plugin package endpoint: ${url}`);
            try {
                context.scannerCallback?.removePackageURL(new URL(url));
                await store.deleteOne({_id: existingEndpoint._id});
            } catch (error: any) {
                logger.error('Deleting endpoint failed', error);
            }
        }
    }

    res.redirect(req.baseUrl);
};

