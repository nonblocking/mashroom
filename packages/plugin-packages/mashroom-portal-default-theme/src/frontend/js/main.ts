
import type {MashroomPortalClientServices, MashroomPortalPageContent} from '@mashroom/mashroom-portal/type-definitions';

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
    const clientServices: MashroomPortalClientServices | undefined = (global as any).MashroomPortalServices;
    if (!clientServices) {
        return;
    }

    const pageId = ev.state?.pageId;
    const pageUrl = document.location.pathname;
    console.debug('Browser navigation to URL:', pageUrl);

    if (pageId) {
        (global as any).replacePageContent(pageId, pageUrl, true);
    } else {
        clientServices.portalPageService.getPageId(pageUrl).then(
            (pageId) => {
                if (pageId) {
                    (global as any).replacePageContent(pageId, pageUrl, true);
                } else {
                    throw new Error(`No page ID found for URL: ${pageUrl}`);
                }
            }
        ).catch((e) => {
            console.error(e);
            document.location.reload();
        });
    }
};

// Dynamically replace the page content
(global as any).replacePageContent = (pageId: string, pageUrl: string, dontAddToHistory = false): boolean => {
    const clientServices: MashroomPortalClientServices | undefined = (global as any).MashroomPortalServices;
    if (!clientServices) {
        return false;
    }
    const contentEl = document.getElementById('portal-page-content');
    if (!contentEl) {
        return false;
    }
    if (pageId === clientServices.portalPageService.getCurrentPageId()) {
        return false;
    }

    console.debug('Replacing page content with pageId:', pageId);
    contentEl.classList.add('transition');

    showPageLoadingIndicator(true);
    clientServices.portalPageService.getPageContent(pageId).then(
        (content: MashroomPortalPageContent) => {
            if (content.fullPageLoadRequired || !content.pageContent) {
                document.location.replace(pageUrl);
            } else {
                contentEl.innerHTML = content.pageContent;
                // console.log('Evaluating', content.evalScript);
                eval(content.evalScript);
                highlightPageIdInNavigation(pageId);
                hideMobileMenu();

                if (!dontAddToHistory) {
                    window.history.pushState({ pageId }, '', pageUrl);
                }

                setTimeout(() => {
                    showPageLoadingIndicator(false);
                    contentEl.classList.remove('transition');
                }, 250);
            }
        },
        (error) => {
            // If an error occurs we do a full page load
            console.error('Dynamically replacing the page content failed!', error);
            document.location.replace(pageUrl);
        }
    )

    return false;
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
