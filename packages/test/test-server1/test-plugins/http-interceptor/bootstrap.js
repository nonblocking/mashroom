
class TestInterceptor {

    constructor(pluginContextHolder) {
        this.pluginContextHolder = pluginContextHolder;
    }

    async intercept(targetUri, existingHeaders, existingQueryParams, req) {
        const pluginContext = this.pluginContextHolder.getPluginContext();
        const logger = pluginContext.loggerFactory('test.http.interceptor');
        const securityService = pluginContext.services.security && req.pluginContext.services.security.service;

        const user = securityService.getUser(req);

        logger.info(`===== Intercepting http proxy call: ${targetUri}, user: ${user.username} =====`);

        return {
        };
    }
}

const bootstrap = async (pluginName, pluginConfig, pluginContextHolder) => {
    return new TestInterceptor(pluginContextHolder);
};

module.exports = bootstrap;


