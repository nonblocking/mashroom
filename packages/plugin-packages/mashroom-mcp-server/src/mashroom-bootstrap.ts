
import mcpApi from './mcp-api';
import type {MashroomApiPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomApiPluginBootstrapFunction = async () => {
    return mcpApi;
};

export default bootstrap;
