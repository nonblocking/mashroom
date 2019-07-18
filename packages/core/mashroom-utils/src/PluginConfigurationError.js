
export default class PluginConfigurationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'PluginConfigurationError';
    }
}
