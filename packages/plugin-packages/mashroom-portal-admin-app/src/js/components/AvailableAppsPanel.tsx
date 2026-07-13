import React, {useCallback, useMemo} from 'react';
import {useTranslation} from 'react-i18next';
import { CircularProgress, ErrorMessage, escapeForRegExp, escapeForHtml } from '@mashroom/mashroom-portal-ui-commons';
import useStore from '../store/useStore';

import type {DragEvent} from 'react';
import type { MashroomAvailablePortalApp } from '@mashroom/mashroom-portal/type-definitions';

type AppsGroupedByCategory = Array<{
    category: string;
    apps: Array<MashroomAvailablePortalApp>;
}>

type FilterTokens = {
    tokens: Array<string>;
    anyMatch: Array<RegExp>;
    fullMatch: Array<RegExp>;
}

type Props = {
    onDragStart?: (event: DragEvent, name: string) => void;
    onDragEnd?: (() => void);
    filter?: string | undefined | null;
};

const CATEGORY_NONE = 'ZZZ';
const CATEGORY_HIDDEN = 'hidden';

export default ({onDragStart, onDragEnd, filter}: Props) => {
    const {t} = useTranslation();
    const availableApps = useStore((state) => state.availableApps);

    const handleDragStart = useCallback((event: DragEvent, name: string): void => {
        console.debug('Drag start: ', name);
        if (onDragStart) {
            onDragStart(event, name);
        }
    }, [onDragStart]);

    const handleDragEnd = useCallback((): void => {
        if (onDragEnd) {
            onDragEnd();
        }
    }, [onDragEnd]);

    const filterTokens = useMemo((): FilterTokens => {
        if (!filter) {
            return {
                tokens: [],
                anyMatch: [],
                fullMatch: []
            };
        }
        const tokens = filter
            .split(' ')
            .filter((t) => t !== '')
            .map((t) => escapeForRegExp(t));
        return {
            tokens,
            anyMatch: tokens.map((t) => new RegExp(`(${t})`, 'ig')),
            fullMatch: tokens.map((t) => new RegExp(`^${t}$`, 'ig'))
        };
    }, [filter]);

    const appsFilteredAndGroupedByCategory = useMemo((): AppsGroupedByCategory => {
        if (!availableApps.apps || !Array.isArray(availableApps.apps )) {
            return [];
        }

        const matches = (app: MashroomAvailablePortalApp) => {
            if (filterTokens.anyMatch.length === 0) {
                return true;
            }
            if (filterTokens.anyMatch.every((matcher) => app.name.match(matcher) || app.title?.match(matcher) || app.description?.match(matcher))) {
                return true;
            }
            if (app.tags && filterTokens.fullMatch.some((matcher) => app.tags.find((tag) => tag.match(matcher)))) {
                return true;
            }
            return false;
        };

        const filteredAndGroupedByCategory: AppsGroupedByCategory = [];
        availableApps.apps.forEach((app) => {
            const category = app.category || CATEGORY_NONE;
            if (category !== CATEGORY_HIDDEN && matches(app)) {
                const existingGroup = filteredAndGroupedByCategory.find((g) => g.category === category);
                if (existingGroup) {
                    existingGroup.apps.push(app);
                } else {
                    filteredAndGroupedByCategory.push({
                        category,
                        apps: [app]
                    });
                }
            }
        });

        filteredAndGroupedByCategory.sort((g1, g2) => g1.category.localeCompare(g2.category));

        return filteredAndGroupedByCategory;
    }, [availableApps.apps, filterTokens]);

    return (
        <div className='available-apps-panel'>
            {availableApps.loading && (
                <CircularProgress />
            )}
            {availableApps.error && (
                <ErrorMessage messageId='loadingFailed' />
            )}
            {!availableApps.error && !availableApps.loading && availableApps.apps && (
                <div className='available-app-list-wrapper'>
                    {appsFilteredAndGroupedByCategory.map((group) => {
                        const { category, apps } = group;
                        const filterReplacement = '<span class="filter-match">$1</span>';
                        return (
                            <div key={category} className='grouped-apps'>
                                <div className='app-category'>
                                    {category !== CATEGORY_NONE ? <span>{category}</span> : <span>{t('uncategorized')}</span>}
                                </div>
                                {apps.map((app) => {
                                    let appName = escapeForHtml(app.title || app.name);
                                    let description = escapeForHtml(app.description || '');
                                    if (filterTokens.tokens.length > 0) {
                                        const replaceExpr = new RegExp(`(${filterTokens.tokens.join('|')})`, 'gi');
                                        appName = appName.replace(replaceExpr, filterReplacement);
                                        description = description.replace(replaceExpr, filterReplacement);
                                    }

                                    return (
                                        <div key={app.name} className='available-app' onDragStart={(e) => handleDragStart(e, app.name)} onDragEnd={handleDragEnd} draggable>
                                            <div className='app-name' dangerouslySetInnerHTML={{ __html: appName }} />
                                            <div className='app-description' dangerouslySetInnerHTML={{ __html: description }} />
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

