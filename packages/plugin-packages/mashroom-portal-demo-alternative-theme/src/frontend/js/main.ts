import type {MashroomPortalClientServices, MashroomPortalPageContent} from '@mashroom/mashroom-portal/type-definitions';

const hideMenu = () => {
    const navWrapper = document.querySelector('.nav-wrapper');
    navWrapper?.classList.remove('show');
};

const toggleMenu = () => {
    const navWrapper = document.querySelector('.nav-wrapper');
    navWrapper?.classList.toggle('show');
};

const showPageTitle = (title: string) => {
    const currentPageEl = document.querySelector('.current-page');
    if (currentPageEl) {
        currentPageEl.textContent = title;
    }
};

const highlightPageIdInNavigation = (pageId: string): void => {
    const activeNavItem = document.querySelector('a.nav-link.active');
    if (activeNavItem) {
        activeNavItem.classList.remove('active');
    }
    const newActiveNavItem = document.querySelector(`[data-mr-page-id="${pageId}"]`);
    if (newActiveNavItem) {
        newActiveNavItem.classList.add('active');
    }
};

const attachToMenuLinks = () => {
    document.querySelectorAll('.nav-link').forEach((el) => {
        const anchor = el as HTMLAnchorElement;
        const pageUrl = anchor.href;
        const pageId = anchor.attributes.getNamedItem('data-mr-page-id')?.value;
        const pageTitle = anchor.attributes.getNamedItem('data-mr-page-title')?.value;
        if (pageId && pageTitle) {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                replacePageContent(pageId, pageUrl, pageTitle);
            });
        }
    });
};

// Dynamically replace the page content
const replacePageContent = (pageId: string, pageUrl: string, pageTitle: string, dontAddToHistory = false): void => {
    const clientServices: MashroomPortalClientServices | undefined = (global as any).MashroomPortalServices;
    if (!clientServices) {
        return;
    }
    const contentEl = document.getElementById('portal-page-content');
    if (!contentEl) {
        return;
    }
    if (pageId === clientServices.portalPageService.getCurrentPageId()) {
        return;
    }

    console.debug('Replacing page content with page:', pageTitle);

    clientServices.portalPageService.getPageContent(pageId).then(
        (content: MashroomPortalPageContent) => {
            if (content.fullPageLoadRequired || !content.pageContent) {
                document.location.replace(pageUrl);
            } else {
                contentEl.innerHTML = content.pageContent;
                // console.log('Evaluating', content.evalScript);
                eval(content.evalScript);
                showPageTitle(pageTitle);
                highlightPageIdInNavigation(pageId);
                hideMenu();

                if (!dontAddToHistory) {
                    window.history.pushState({ pageId, pageTitle }, '', pageUrl);
                }
            }
        },
        (error) => {
            // If an error occurs we do a full page load
            console.error('Dynamically replacing the page content failed!', error);
            document.location.replace(pageUrl);
        }
    );
}

(global as any).onpopstate = (ev: PopStateEvent) => {
    const clientServices: MashroomPortalClientServices | undefined = (global as any).MashroomPortalServices;
    if (!clientServices) {
        return;
    }

    const pageId = ev.state?.pageId;
    const pageTitle = ev.state?.pageTitle;
    const pageUrl = document.location.pathname;
    console.debug('Browser navigation to URL:', pageUrl);

    if (pageId) {
        replacePageContent(pageId, pageUrl, pageTitle, true);
    } else {
        clientServices.portalPageService.getPageId(pageUrl).then(
            (pageId) => {
                if (pageId) {
                    let pageTitle = pageId;
                    const navEl = document.querySelector(`[data-mr-page-id="${pageId}"]`)
                    if (navEl) {
                        pageTitle = navEl.attributes.getNamedItem('data-mr-page-title')?.value || pageId;
                    }
                    replacePageContent(pageId, pageUrl, pageTitle, true);
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

document.addEventListener('DOMContentLoaded', () => {
    attachToMenuLinks();
    document.getElementById('menu-toggle')?.addEventListener('click', toggleMenu);
});
