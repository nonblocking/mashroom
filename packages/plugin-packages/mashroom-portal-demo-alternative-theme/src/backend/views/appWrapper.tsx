
// This template could safely be removed, since it resembles the default

import React from 'react';
import type {MashroomPortalAppWrapperRenderModel} from '@mashroom/mashroom-portal/type-definitions';

export default ({ appId, pluginName, safePluginName, appSSRHtml, title }: MashroomPortalAppWrapperRenderModel) => (
    <div data-mr-app-id={appId} data-mr-app-name={pluginName} className={`mashroom-portal-app-wrapper portal-app-${safePluginName}`}>
        <div className="mashroom-portal-app-header">
            <div data-mr-app-content="title" className="mashroom-portal-app-header-title">{title}</div>
        </div>
        <div data-mr-app-content="app" className="mashroom-portal-app-host">
            {appSSRHtml && <div dangerouslySetInnerHTML={{ __html: appSSRHtml }} />}
            {!appSSRHtml && <div className="mashroom-portal-app-loading"><span/></div>}
       </div>
    </div>
);

