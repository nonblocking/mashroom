import type {MashroomPortalAppErrorRenderModel} from '../../../type-definitions';

export default ({errorMessage, messages, title}: MashroomPortalAppErrorRenderModel) => {
    if (!errorMessage) {
        const rawMessage = messages('portalAppLoadingFailed') || 'Portal app ${name} is temporarily not available';
        errorMessage = rawMessage.replace('${name}', title);
    }
    return `
        <div class="mashroom-portal-app-loading-error">
            <span>${errorMessage}</span>
        </div>
    `;
};
