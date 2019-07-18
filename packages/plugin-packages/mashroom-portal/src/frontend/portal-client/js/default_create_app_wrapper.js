// @flow

import type {CreateAppWrapper} from '../../../../type-definitions';

const defaultCreateAppWrapper: CreateAppWrapper = (id, pluginName) => {
    const classFromPluginName = pluginName.toLowerCase().replace(/ /g, '-');
    const portalAppWrapperElement = document.createElement('div');
    portalAppWrapperElement.id = `portal-app-${id}`;
    portalAppWrapperElement.className = `mashroom-portal-app-wrapper portal-app-${classFromPluginName}`;

    const headerElement = document.createElement('div');
    headerElement.className = 'mashroom-portal-app-header';
    const portalAppTitleElement = document.createElement('div');
    portalAppTitleElement.className = 'mashroom-portal-app-header-title';
    portalAppTitleElement.innerText = pluginName;
    headerElement.appendChild(portalAppTitleElement);
    portalAppWrapperElement.appendChild(headerElement);

    const portalAppHostElement = document.createElement('div');
    portalAppHostElement.className = 'mashroom-portal-app-host';
    portalAppHostElement.innerHTML = '<div class="mashroom-portal-app-loading"></div>';
    portalAppWrapperElement.appendChild(portalAppHostElement);

    return {
        portalAppWrapperElement,
        portalAppHostElement,
        portalAppTitleElement
    };
};

export default defaultCreateAppWrapper;
