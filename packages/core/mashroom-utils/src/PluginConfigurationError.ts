
export default class PluginConfigurationError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'PluginConfigurationError';
    }
}
