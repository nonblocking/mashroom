
import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';
import {CircularProgress, ErrorMessage, escapeForRegExp, escapeForHtml} from '@mashroom/mashroom-portal-ui-commons';

import type {ReactNode, DragEvent} from 'react';
import type {AvailableApps} from '../types';
import type {MashroomAvailablePortalApp} from '@mashroom/mashroom-portal/type-definitions';

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
    availableApps: AvailableApps;
    onDragStart?: (event: DragEvent, name: string) => void;
    onDragEnd?: (() => void);
    filter?: string | undefined | null;
};

const CATEGORY_NONE = 'ZZZ';
const CATEGORY_HIDDEN = 'hidden';

export default class AvailableAppsPanel extends PureComponent<Props> {

    renderLoading(): ReactNode {
        return (
            <CircularProgress/>
        );
    }

    renderError(): ReactNode {
        return (
            <ErrorMessage messageId='loadingFailed' />
        );
    }

    onDragStart(event: DragEvent, name: string): void {
        const {onDragStart} = this.props;
        console.debug('Drag start: ', name);
        if (onDragStart) {
            onDragStart(event, name);
        }
    }

    onDragEnd(): void {
        const {onDragEnd} = this.props;
        if (onDragEnd) {
            onDragEnd();
        }
    }

    getFilterTokens(): FilterTokens {
        const {filter} = this.props;
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
    }

    getAppsFilteredAndGroupedByCategory(tokens: FilterTokens): AppsGroupedByCategory {
        const {availableApps: availableAppsWrapper} = this.props;
        const availableApps = availableAppsWrapper.apps;
        if (!availableApps || !Array.isArray(availableApps)) {
            return [];
        }

        const matches = (app: MashroomAvailablePortalApp) => {
            if (tokens.anyMatch.length === 0) {
                return true;
            }
            if (tokens.anyMatch.every((matcher) => app.name.match(matcher) || (app.description && app.description.match(matcher)))) {
                return true;
            }
            if (app.tags && tokens.fullMatch.some((matcher) => app.tags.find((tag) => tag.match(matcher)))) {
                return true;
            }
            return false;
        };

        const filteredAndGroupedByCategory: AppsGroupedByCategory = [];
        availableApps.forEach((app) => {
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

        // Sort by category
        filteredAndGroupedByCategory.sort((g1, g2) => g1.category.localeCompare(g2.category));

        return filteredAndGroupedByCategory;
    }

    renderCategoryApps(apps: Array<MashroomAvailablePortalApp>, tokens: FilterTokens): Array<ReactNode> {
        const filterReplacement = '<span class="filter-match">$1</span>';

        return apps.map((app) => {
            let appName = escapeForHtml(app.name);
            let description = escapeForHtml(app.description || '');
            if (tokens.tokens.length > 0) {
                const replaceExpr = new RegExp(`(${tokens.tokens.join('|')})`, 'gi');
                appName = appName.replace(replaceExpr, filterReplacement);
                description = description.replace(replaceExpr, filterReplacement);
            }

            return (
                <div key={app.name} className='available-app' onDragStart={(e) => this.onDragStart(e, app.name)} onDragEnd={this.onDragEnd.bind(this)} draggable>
                    <div className='app-name' dangerouslySetInnerHTML={{ __html: appName }}/>
                    <div className='app-description' dangerouslySetInnerHTML={{ __html: description }}/>
                </div>
            );
        });
    }

    renderAvailableApps(): ReactNode {
        const tokens = this.getFilterTokens();
        const filteredAndGroupedByCategory = this.getAppsFilteredAndGroupedByCategory(tokens);

        const groupedApps: Array<ReactNode> = [];

        filteredAndGroupedByCategory.forEach((group) => {
            const { category, apps } = group;
            groupedApps.push(
                <div key={category} className='grouped-apps'>
                    <div className='app-category'>
                        {category !== CATEGORY_NONE ? <span>{category}</span> : <FormattedMessage id='uncategorized'/>}
                    </div>
                    {this.renderCategoryApps(apps, tokens)}
                </div>
            );
        });

        return (
            <div className='available-app-list-wrapper'>
                {groupedApps}
            </div>
        );
    }

    render(): ReactNode {
        const {availableApps: {loading, error, apps}} = this.props;
        let content;
        if (loading) {
            content = this.renderLoading();
        } else if (error || !apps) {
            content = this.renderError();
        } else {
            content = this.renderAvailableApps();
        }

        return (
           <div className='available-apps-panel'>
               {content}
           </div>
        );
    }
}
