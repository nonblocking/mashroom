
// This template could safely be removed, since it resembles the default

import React from 'react';
import type {MashroomPortalAppErrorRenderModel} from '@mashroom/mashroom-portal/type-definitions';

export default ({ pluginName, errorMessage, messages }: MashroomPortalAppErrorRenderModel) => {
    let htmlMessage = errorMessage || messages('portalAppLoadingFailed') || 'Portal app ${name} is temporarily not available';
    htmlMessage = htmlMessage.replace('${name}', pluginName);

    return (
        <div className="mashroom-portal-app-loading-error">
            <span dangerouslySetInnerHTML={{ __html: htmlMessage }} />
        </div>
    );
};
