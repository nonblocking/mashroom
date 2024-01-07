
import expressAppFactory from './webapp';
import type { MashroomWebAppPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomWebAppPluginBootstrapFunction = async () => {
    return expressAppFactory();
};

export default bootstrap;
