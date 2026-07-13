import context from '../context';
import getRemotePluginPackageEndpointStore from '../store/getRemotePluginPackageEndpointStore';
import type { URL } from 'url';
import type {Request} from 'express';
import type { MashroomPluginScannerHints } from '@mashroom/mashroom/type-definitions';
import type {
    MashroomRemotePackageScannerService as MashroomRemotePackageScannerServiceType
} from '../../../type-definitions';

export default class MashroomRemotePackageScannerService implements MashroomRemotePackageScannerServiceType {

    async addOrUpdatePackageUrl(req: Request, url: URL, hints?: MashroomPluginScannerHints) {
        if (!context.scannerCallback) {
            throw new Error('Remote package scanner not yet available');
        }
        const store = await getRemotePluginPackageEndpointStore(req.pluginContext);
        await store.insertOne({
            url: url.toString(),
            lastRefreshTimestamp: Date.now(),
        });
        context.scannerCallback.addOrUpdatePackageUrl(url, hints);
    }

    async removePackageUrl(req: Request, url: URL) {
        if (!context.scannerCallback) {
            throw new Error('Remote package scanner not yet available');
        }
        const store = await getRemotePluginPackageEndpointStore(req.pluginContext);
        const existingEndpoint = await store.findOne({ url: url.toString() });
        if (existingEndpoint) {
            await store.deleteOne({_id: existingEndpoint._id});
        }
        context.scannerCallback.removePackageUrl(url);
    }
}
