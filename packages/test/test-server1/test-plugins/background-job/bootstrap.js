

const backgroundJob = (pluginContext) => {
    const logger = pluginContext.loggerFactory('test.backgroundJob');

    logger.info(`===== Executing dummy background job  =====`);
};

const bootstrap = () => {
    return backgroundJob;
};

module.exports = bootstrap;

