
import MashroomRemotePackageScannerService from './MashroomRemotePackageScannerService';
import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const service = new MashroomRemotePackageScannerService();

    return {
        service,
    };
};

export default bootstrap;
