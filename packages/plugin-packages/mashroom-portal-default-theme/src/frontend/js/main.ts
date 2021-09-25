
// Clientside JavaScript

import type {MashroomPortalClientServices, MashroomPortalPageContent} from '@mashroom/mashroom-portal/type-definitions';

(global as any).toggleMenu = () => {
    document.querySelector('nav')?.classList.toggle('show');
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
        console.debug('Browser navigation. Replacing page content with pageId', pageId);
        (global as any).replacePageContent(pageId, pageContentUrl);
    }
};

// Dynamically replace the page content
(global as any).replacePageContent = (pageId: string, fullPageUrl: string) => {
    console.debug('Replacing page content with pageId', pageId);

    const clientServices: MashroomPortalClientServices | undefined = (global as any).MashroomPortalServices;
    if (!clientServices) {
        return;
    }

    const contentEl = document.getElementById('portal-page-content');
    if (!contentEl) {
        return;
    }

    const currentPageId = getCurrentPageId();
    if (pageId === currentPageId) {
        return;
    }

    const pageContentUrl = `${clientServices.portalSiteService.getCurrentSiteUrl()}/___/api/pages/${pageId}/content?currentPageId=${currentPageId}`;

    fetch(pageContentUrl, {
        credentials: 'same-origin'
    })
    .then((result) => {
        const contentLength = parseInt(result.headers.get('Content-Length') || '0');
        const reader = result.body?.getReader();
        if (!reader) {
            return result.json();
        }
        setPageLoadingProgress(10);
        return readStreamWithProgress(reader, contentLength, (progress) => {
            setPageLoadingProgress(progress);
        });
    })
    .then((content: MashroomPortalPageContent) => {
        if (content.fullPageLoadRequired) {
            document.location.replace(fullPageUrl);
        } else {
            contentEl.innerHTML = content.pageContent;
            eval(content.evalScript);
            highlightPageIdInNavigation(pageId);
            window.history.pushState({
                pageId,
            }, '', fullPageUrl);
            setTimeout(() => {
                setPageLoadingProgress(0);
            }, 500);
        }
    })
    .catch((error) => {
        // If an error occurs we do a full page load
        console.error('Dynamically replacing the page content failed!', error);
        document.location.replace(fullPageUrl);
    });
}

const setPageLoadingProgress = (progress: number) => {
    const loadingAnimationEl = document.getElementById('page-loading-progress');
    if (loadingAnimationEl) {
        if (progress > 0) {
            loadingAnimationEl.classList.add('anim');
        } else {
            loadingAnimationEl.classList.remove('anim');
        }
        loadingAnimationEl.style.width = `${Math.min(100, progress)}%`;
    }
}

const getCurrentPageId = (): string | null => {
    const navigationEl = document.getElementById('navigation');
    if (!navigationEl) {
        return null;
    }
    const activeNavItem = navigationEl.querySelector('.nav-link.active');
    if (!activeNavItem) {
        return null;
    }
    return activeNavItem.getAttribute('data-mr-page-id');
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

const readStreamWithProgress = (reader: ReadableStreamDefaultReader, contentLength: number, progressCb: (progress: number) => void): Promise<any> => {
    return new Promise((resolve, reject) => {
        let receivedLength = 0;
        const chunks: Array<any> = [];
        const readChunk = () => {
            reader.read().then(
                ({done, value}) => {
                    if (!done) {
                        chunks.push(value);
                        receivedLength += value.length;
                        const progress = Math.trunc(receivedLength / contentLength * 100);
                        progressCb(progress);
                        readChunk();
                    } else {
                        try {
                            const chunksAll = new Uint8Array(receivedLength);
                            let position = 0;
                            for (const chunk of chunks) {
                                chunksAll.set(chunk, position);
                                position += chunk.length;
                            }
                            const result = new TextDecoder('utf-8').decode(chunksAll);
                            resolve(JSON.parse(result));
                        } catch (e) {
                            reject(e);
                        }
                    }
                },
                (error) => {
                    reject(error);
                });
        };
        readChunk();
    });
};
