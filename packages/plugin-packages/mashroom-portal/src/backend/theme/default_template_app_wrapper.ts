import type {MashroomPortalAppWrapperRenderModel} from '../../../type-definitions';

export default ({appId, pluginName, safePluginName, title, appSSRHtml}: MashroomPortalAppWrapperRenderModel) => (`
    <div id="portal-app-${appId}" class="mashroom-portal-app-wrapper portal-app-${safePluginName}">
        <div class="mashroom-portal-app-header">
            <div class="mashroom-portal-app-header-title" data-replace-content="title">${title}</div>
        </div>
        <div class="mashroom-portal-app-host" data-replace-content="app">
           ${appSSRHtml ? appSSRHtml : '<div class="mashroom-portal-app-loading"><span/></div>'}
        </div>
    </div>
`)
