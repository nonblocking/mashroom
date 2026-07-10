import type {MashroomPluginScannerHints} from '@mashroom/mashroom/type-definitions';
import type {URL} from 'url';
import type {Request} from 'express';

/**
 * This service can be used to programmatically add or remove remote plugin package URLs.
 */
export interface MashroomRemotePackageScannerService {
    addOrUpdatePackageUrl(req: Request, url: URL, hints?: MashroomPluginScannerHints): Promise<void>;
    removePackageUrl(req: Request, url: URL): void;
}
