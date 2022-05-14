import type {MashroomPortalAppWrapperRenderModel} from '../../../type-definitions';

export default ({appId, pluginName, safePluginName, title, appSSRHtml}: MashroomPortalAppWrapperRenderModel) => (`
    <div data-mr-app-id="${appId}" class="mashroom-portal-app-wrapper portal-app-${safePluginName}">
        <div class="mashroom-portal-app-header">
            <div data-mr-app-content="title" class="mashroom-portal-app-header-title">${title}</div>
        </div>
        <div data-mr-app-content="app" class="mashroom-portal-app-host">
           ${appSSRHtml ? appSSRHtml : '<div class="mashroom-portal-app-loading"><span/></div>'}
        </div>
    </div>
`);
