import context from '../context';
import type {
    MashroomPluginPackageScanner,
    MashroomPluginScannerCallback
} from '@mashroom/mashroom/type-definitions';

export const SCANNER_NAME = 'Kubernetes Remote Portal Apps Plugin Scanner';

export default class KubernetesRemotePortalAppsPluginScanner implements MashroomPluginPackageScanner {

    get name() {
        return SCANNER_NAME;
    }

    setCallback(callback: MashroomPluginScannerCallback) {
        context.scannerCallback = callback;
    }

    async start() {
        // Nothing to do
    }

    async stop() {
        // Nothing to do
    }

}
