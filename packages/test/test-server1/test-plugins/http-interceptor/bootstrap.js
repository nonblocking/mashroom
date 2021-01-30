
class TestInterceptor {

    async interceptRequest(targetUri, existingHeaders, existingQueryParams, clientRequest, clientResponse) {
        const logger = clientRequest.pluginContext.loggerFactory('test.http.interceptor');
        const securityService = clientRequest.pluginContext.services.security && clientRequest.pluginContext.services.security.service;

        const user = securityService.getUser(clientRequest);

        logger.info(`===== Intercepting http proxy request: ${targetUri}, user: ${user.username} =====`);


        return null;
    }

    async interceptResponse(targetUri, existingHeaders, targetResponse, clientRequest, clientResponse) {
        const logger = clientRequest.pluginContext.loggerFactory('test.http.interceptor');

        logger.info(`===== Intercepting http proxy response: ${targetUri}, response code: ${targetResponse.statusCode}  =====`);

        return null;
    }
}

const bootstrap = async () => {
    return new TestInterceptor();
};

module.exports = bootstrap;


