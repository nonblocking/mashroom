
const bootstrap = async () => {
    return {
        loadPortalResourcesCondition: () => true,
        portalAppSetupEnhancer: (portalAppSetup, req) => {
            const logger = req.pluginContext.loggerFactory('test.portal.enhancer');

            logger.info(`===== Enhancing portalAppSetup: ${JSON.stringify(portalAppSetup, null, 2)} =====`);

            return portalAppSetup;
        },
    }
};

module.exports = bootstrap;


