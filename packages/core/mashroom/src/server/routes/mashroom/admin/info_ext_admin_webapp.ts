
import infoTemplate from './template';

import type {Request, Response} from 'express';

const middlewareStack = (req: Request, res: Response) => {
    res.type('text/html');
    res.send(infoTemplate(externalAdminApp(req), req));
};

export default middlewareStack;

const externalAdminApp = (req: Request) => {
    const path = req.path.substr('/ext'.length);
    const adminIntegrationPlugins = req.pluginContext.services.core.pluginService.getPlugins().filter((p) => p.type === 'admin-ui-integration');
    const adminIntegrationPlugin = adminIntegrationPlugins.find((p) => p.config?.path === path);

    if (!adminIntegrationPlugin || !adminIntegrationPlugin.pluginDefinition.target) {
        return  `
            <div>
                Not found
            </div>
        `
    }

    const targetPlugin = req.pluginContext.services.core.pluginService.getPlugins().find((p) => p.name === adminIntegrationPlugin.pluginDefinition.target);
    if (!targetPlugin || !targetPlugin.config?.path) {
        return  `
            <div>
                Not found
            </div>
        `
    }

    return  `
        <div class="admin-ui-integration-wrapper">
            <iframe id="adminUIIntegrationIFrame" frameborder="0" style="width: 100%; height: ${adminIntegrationPlugin.config?.height || '80vh'}" src="${targetPlugin.config.path}">
            </iframe>

            <script>
                 window.addEventListener('message', onMessage);

                function onMessage(event) {
                    const iframe = document.getElementById('adminUIIntegrationIFrame');
                    if (iframe && event.source === iframe.contentWindow) {
                        console.info('Received message from iframe: ', event.data);
                        if (typeof(event.data.height) === 'number') {
                             iframe.style.height = '' + event.data.height + 'px';
                             iframe.style.overflowY = 'hidden';
                             iframe.scrolling = 'no';
                        }
                    }
                }
            </script>
        </div>
    `
};
