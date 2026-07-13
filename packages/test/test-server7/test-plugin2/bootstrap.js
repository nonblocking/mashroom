
import webapp from './webapp.js';

const plugin = async (pluginName, pluginConfig, contextHolder) => {
    const {name} = pluginConfig;
    return webapp(name);
}

export default plugin;

