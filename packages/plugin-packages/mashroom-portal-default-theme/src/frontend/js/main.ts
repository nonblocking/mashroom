
// Clientside JavaScript

import type {MashroomPortalClientServices, MashroomPortalPageContent} from '@mashroom/mashroom-portal/type-definitions';

let startPageAddedToHistory = false;

(global as any).toggleMenu = () => {
    document.getElementById('navigation')?.classList.toggle('show');
}

(global as any).toggleShowAppVersions = () => {
    const clientServices: MashroomPortalClientServices | undefined = (global as any).MashroomPortalServices;
    if (!clientServices) {
        return;
    }
    if (document.querySelector('.mashroom-portal-app-info')) {
        clientServices.portalAppService.hideAppInfos()
    } else {
        clientServices.portalAppService.showAppInfos()
    }
}

(global as any).onpopstate = (ev: PopStateEvent) => {
    const pageId = ev.state?.pageId;
    const pageContentUrl = document.location.pathname;
    if (pageId) {
        console.debug('Browser navigation. Replacing page content with pageId:', pageId);
        (global as any).replacePageContent(pageId, pageContentUrl, true);
    }
};

// Dynamically replace the page content
(global as any).replacePageContent = (pageId: string, fullPageUrl: string, dontAddToHistory = false) => {
    const clientServices: MashroomPortalClientServices | undefined = (global as any).MashroomPortalServices;
    if (!clientServices) {
        return;
    }

    const currentPageId = clientServices.portalAdminService.getCurrentPageId();
    if (pageId === currentPageId) {
        return;
    }
    const contentEl = document.getElementById('portal-page-content');
    if (!contentEl) {
        return;
    }

    if (!startPageAddedToHistory) {
        // Add first page to history, otherwise it won't be possible to navigate back to it
        const fullPageUrl = document.location.pathname;
        window.history.pushState({
            pageId: currentPageId,
        }, '', fullPageUrl);
        startPageAddedToHistory = true;
    }

    console.debug('Replacing page content with pageId:', pageId);

    showPageLoadingIndicator(true);
    clientServices.portalPageService.getPageContent(pageId).then(
        (content: MashroomPortalPageContent) => {
            if (content.fullPageLoadRequired) {
                document.location.replace(fullPageUrl);
            } else {
                contentEl.innerHTML = content.pageContent;
                // console.log('Evaluating', content.evalScript);
                eval(content.evalScript);
                highlightPageIdInNavigation(pageId);
                hideMobileMenu();

                if (!dontAddToHistory) {
                    window.history.pushState({
                        pageId,
                    }, '', fullPageUrl);
                }

                setTimeout(() => {
                    showPageLoadingIndicator(false);
                }, 250);
            }
        },
        (error) => {
            // If an error occurs we do a full page load
            console.error('Dynamically replacing the page content failed!', error);
            document.location.replace(fullPageUrl);
        }
    )
}

const hideMobileMenu = () => {
    document.getElementById('navigation')?.classList.remove('show');
}

const showPageLoadingIndicator = (show: boolean) => {
    const loadingAnimationEl = document.getElementById('page-loading-progress');
    if (!loadingAnimationEl) {
        return;
    }
    if (show) {
        loadingAnimationEl.classList.add('show');
    } else {
        loadingAnimationEl.classList.remove('show');
    }
}

const highlightPageIdInNavigation = (pageId: string): void => {
    const navigationEl = document.getElementById('navigation') as HTMLElement | undefined;
    if (!navigationEl) {
        return;
    }
    const activeNavItem = navigationEl.querySelector('.nav-link.active');
    if (activeNavItem) {
        activeNavItem.classList.remove('active');
    }
    const newActiveNavItem = navigationEl.querySelector(`[data-mr-page-id="${pageId}"]`);
    if (newActiveNavItem) {
        newActiveNavItem.classList.add('active');
    }
};
