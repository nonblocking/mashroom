
import type {MashroomPortalClientServices, MashroomPortalPageContent} from '@mashroom/mashroom-portal/type-definitions';

const COOKIE_DISPLAY_MODE = 'mashroom_portal_display_mode';
const COOKIE_PREFERRED_LANGUAGE = 'mashroom_preferred_lang';

(globalThis as any).toggleMenu = () => {
    document.getElementById('navigation')?.classList.toggle('show');
};

(globalThis as any).toggleShowAppVersions = () => {
    const clientServices: MashroomPortalClientServices | undefined = (global as any).MashroomPortalServices;
    if (!clientServices) {
        return;
    }
    if (document.querySelector('.mashroom-portal-app-info')) {
        clientServices.portalAppService.hideAppInfos();
    } else {
        clientServices.portalAppService.showAppInfos();
    }
};

(globalThis as any).onpopstate = (ev: PopStateEvent) => {
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
(globalThis as any).replacePageContent = (pageId: string, pageUrl: string, dontAddToHistory = false): boolean => {
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
    );

    return false;
};

const hideMobileMenu = () => {
    document.getElementById('navigation')?.classList.remove('show');
};

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
};

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

const initDisplayMode = () => {
    const preferDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    let mode = document.documentElement.getAttribute('data-bs-theme');
    let modeFromCookie = getCookieValue(COOKIE_DISPLAY_MODE);
    if (modeFromCookie) {
        mode = modeFromCookie;
    }
    if (!mode || mode === 'auto') {
        mode = preferDarkMode ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-bs-theme', mode);
    (globalThis as any).__MASHROOM_PORTAL_DARK_MODE__ = mode === 'dark';
};

(globalThis as any).toggleDisplayMode = () =>  {
    const mode = document.documentElement.getAttribute('data-bs-theme');
    const newMode = mode === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-bs-theme', newMode);
    (globalThis as any).__MASHROOM_PORTAL_DARK_MODE__ = newMode === 'dark';
    setCookie(COOKIE_DISPLAY_MODE, newMode);
};

const languageSelectorOutsideClickListener = (event: MouseEvent) => {
    const availableLanguages = document.getElementById('available-languages');
    if (!availableLanguages?.contains(event.target as Node)) {
        availableLanguages?.classList.remove('show');
        globalThis.removeEventListener('click', languageSelectorOutsideClickListener);
    }
};

(globalThis as any).openLanguageSelector = () =>  {
    const availableLanguages = document.getElementById('available-languages');
    if (!availableLanguages) {
        return;
    }
    availableLanguages.classList.add('show');
    setTimeout(() => globalThis.addEventListener('click', languageSelectorOutsideClickListener), 100);
};

(globalThis as any).selectLanguage = (lang: string) =>  {
    document.getElementById('available-languages')?.classList.remove('show');
    globalThis.removeEventListener('click', languageSelectorOutsideClickListener);
    const clientServices: MashroomPortalClientServices | undefined = (global as any).MashroomPortalServices;
    if (!clientServices) {
        return;
    }
    setCookie(COOKIE_PREFERRED_LANGUAGE, lang);
    clientServices.portalUserService.setUserLanguage(lang).then(() => {
        document.location.reload();
    });
};

const setCookie = (name: string, value: string) => {
    document.cookie = `${name}=${value};path=/;max-age=31536000`;
};

const getCookieValue = (name: string): string | undefined => {
    return document.cookie
        .split(';')
        .find((row) => row.indexOf(`${name}=`) !== -1)
        ?.split('=').pop();
};

initDisplayMode();
