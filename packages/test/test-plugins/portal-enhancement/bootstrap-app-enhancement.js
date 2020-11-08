
const bootstrap = async () => {
    return {
        enhancePortalAppSetup: (portalAppSetup, portalApp, req) => {
            const logger = req.pluginContext.loggerFactory('test.portal.enhancer');

            logger.info(`===== Enhancing portalAppSetup: ${JSON.stringify(portalAppSetup, null, 2)} =====`);

            return Promise.resolve({
                ...portalAppSetup,
                appConfig: {
                    ...portalAppSetup.appConfig,
                    info: 'Portal App Enhancement Test App',
                }
            });
        },
    }
};

module.exports = bootstrap;


