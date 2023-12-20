
export default class PluginBootstrapError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'PluginBootstrapError';
    }
}
