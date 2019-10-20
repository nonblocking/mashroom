// @flow

import MashroomWebSocketService from './MashroomWebSocketService';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const pluginContext = pluginContextHolder.getPluginContext();
    const service = new MashroomWebSocketService();

    addTestListener(service, pluginContext.loggerFactory);

    return {
        service,
    };
};

export default bootstrap;

const addTestListener = (service, loggerFactory) => {
    const logger = loggerFactory('mashroom.websocket.service');
    service.addMessageListener((path) => path === '/test', (message, client) => {
        logger.info(`Received test message from user ${client.user.username}:`, message);
        service.addDisconnectListener((disconnectedClient) => {
           if (disconnectedClient === client) {
               logger.info(`Test user ${client.user.username} is gone`);
           }
        });
        setTimeout(async () => {
            await service.sendMessage(client, {
                greetings: `Hello ${client.user.displayName || client.user.username}!`
            });
        }, 500);
    });
};
