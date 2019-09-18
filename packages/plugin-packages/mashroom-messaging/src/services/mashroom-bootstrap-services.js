// @flow

import context from '../context';
import MashroomMessagingInternalService from './MashroomMessagingInternalService';
import MashroomMessagingService from './MashroomMessagingService';
import MashroomMessagingWebSocketHandler from './MashroomMessagingWebSocketHandler';
import MashroomMessageTopicACLChecker from './MashroomMessageTopicACLChecker';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const { externalProvider, externalTopics, userPrivateBaseTopic, enableWebSockets, topicACL } = pluginConfig;
    const pluginContext = pluginContextHolder.getPluginContext();

    const aclChecker = new MashroomMessageTopicACLChecker(topicACL, pluginContext.serverConfig.serverRootFolder, pluginContext.loggerFactory);

    const internalService = new MashroomMessagingInternalService(externalProvider, context.pluginRegistry,
        externalTopics, userPrivateBaseTopic, enableWebSockets, aclChecker, pluginContext.services.core.pluginService, pluginContext.loggerFactory);
    const service = new MashroomMessagingService(internalService, enableWebSockets);

    internalService.startListeners();
    pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
        internalService.stopListeners();
    });

    if (enableWebSockets) {
        const webSocketHandler = new MashroomMessagingWebSocketHandler(internalService, pluginContextHolder);
        webSocketHandler.startListeners();
        pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
            webSocketHandler.stopListeners();
        });
    }

    return {
        service
    };
};

export default bootstrap;
