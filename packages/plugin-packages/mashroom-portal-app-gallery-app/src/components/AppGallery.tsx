import React, {useEffect, useState, useRef} from 'react';
import loadMessages from '../messages';
import styles from './AppGallery.scss';
import PortalApp from './PortalApp';
import ScreenshotOverlay from './ScreenshotOverlay';
import FilterBar from './FilterBar';
import type enMessages from '../messages/messages-en';
import type {MashroomKnownPortalApp, MashroomPortalAppService} from '@mashroom/mashroom-portal/type-definitions';

type Props = {
    lang: string;
    sandboxPath: string | null;
    showTitle: boolean;
    overrideTitle: string | null;
    showHiddenApps: boolean;
    showNotPermittedApps: boolean;
    portalAppService: MashroomPortalAppService;
}

export default ({ lang, sandboxPath, showTitle, overrideTitle, showHiddenApps, showNotPermittedApps, portalAppService }: Props) => {
    const appWrapperRef = useRef<HTMLDivElement>(null);
    const [portalApps, setPortalApps] = useState<Array<MashroomKnownPortalApp>>([]);
    const [error, setError] = useState(false);
    const [messages, setMessages] = useState<typeof enMessages>({ errorLoading: 'Error' } as any);
    const [searchFilter, setSearchFilter] = useState<string>('');
    const [allCategories, setAllCategories] = useState<Array<string>>([]);
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [overlayImgSrc, setOverlayImgSrc] = useState<string>();
    const [appWrapperWidth, setAppWrapperWidth] = useState<number>();

    useEffect(() => {
        portalAppService.searchApps({
            q: searchFilter ?? undefined,
            includeNotPermitted: showNotPermittedApps,
        }).then((knownApps) => {
            setPortalApps(knownApps
                .filter((app) => {
                    if (!showHiddenApps && app.category && app.category.toLowerCase() === 'hidden') {
                        return false;
                    }
                    if (categoryFilter) {
                        return app.category && app.category === categoryFilter;
                    }
                    return true;
                })
                .sort((app1, app2) => {
                    return (app1.title || app1.name).localeCompare((app2.title || app2.name));
                })
            );
        }).catch((e) => {
            console.error('Error loading known Portal Apps', e);
            setError(true);
        });
        loadMessages(lang).then((messages) => {
            setMessages(messages);
        }).catch((e) => {
            console.error('Loading messages failed', e);
        });
    }, [searchFilter, categoryFilter]);

    useEffect(() => {
        portalAppService.searchApps({
            includeNotPermitted: true,
        }).then((knownApps) => {
            const categories: Array<string> = [];
            knownApps.forEach(({category}) => {
                if (category && categories.indexOf(category) === -1) {
                    categories.push(category);
                }
            });
            setAllCategories(categories);
        }).catch((e) => {
            console.error('Loading categories failed', e);
        });
    }, []);

    useEffect(() => {
        if (appWrapperRef.current) {
            const resizeObserver = new ResizeObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.target === appWrapperRef.current) {
                        setAppWrapperWidth(entry.contentRect.width);
                    }
                });
            });
            resizeObserver.observe(appWrapperRef.current);
            return () => {
                resizeObserver.disconnect();
            };
        }
    }, [appWrapperRef.current]);

    let appsWrapperStyle = styles.PortalApps;
    if (appWrapperWidth) {
        if (appWrapperWidth > 1200) {
            appsWrapperStyle += ` ${  styles.PortalApps3Columns}`;
        } else if (appWrapperWidth > 800) {
            appsWrapperStyle += ` ${  styles.PortalApps2Columns}`;
        }
    }

    return (
        <div className={styles.AppGallery}>
            {showTitle &&  (
                <h2>{overrideTitle ?? messages.title}</h2>
            )}
            {error && (
                <div className={styles.Error}>
                    {messages.errorLoading}
                </div>
            )}
            {!error && (
                <>
                    <FilterBar
                        allCategories={allCategories}
                        categoryFilter={categoryFilter}
                        setCategoryFilter={(cat) => setCategoryFilter(cat)}
                        searchFilter={searchFilter}
                        setSearchFilter={(filter) => setSearchFilter(filter)}
                        messages={messages}
                    />
                    <div className={appsWrapperStyle} ref={appWrapperRef}>
                        {portalApps.map((app) => (
                            <PortalApp
                                key={app.name}
                                app={app}
                                sandboxPath={sandboxPath}
                                searchFilter={searchFilter}
                                messages={messages}
                                showImageInOverlay={(src) => setOverlayImgSrc(src)}
                            />
                        ))}
                    </div>
                </>
            )}
            <ScreenshotOverlay src={overlayImgSrc} onClose={() => setOverlayImgSrc(undefined)} />
        </div>
    );
};
