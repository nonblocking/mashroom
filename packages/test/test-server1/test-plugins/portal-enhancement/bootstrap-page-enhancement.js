
const bootstrap = async () => {
    return {
        dynamicResources: {
            myScript: () => `console.info('My Script added');`,
        },
        rules: {

        }
    }
};

module.exports = bootstrap;


