// @flow

import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';
import {CircularProgress, ErrorMessage, escapeForRegExp, escapeForHtml} from '@mashroom/mashroom-portal-ui-commons';

import type {Node} from 'react';
import type {AvailableApps} from '../../../type-definitions';
import type {MashroomAvailablePortalApp} from '@mashroom/mashroom-portal/type-definitions';

type Props = {
    availableApps: AvailableApps,
    onDragStart: ?(event: DragEvent, name: string) => void,
    onDragEnd: ?() => void,
    filter?: ?string
};

const CATEGORY_NONE = '__';
const CATEGORY_HIDDEN = 'hidden';

export default class AvailableAppsPanel extends PureComponent<Props> {

    renderLoading() {
        return (
            <CircularProgress/>
        );
    }

    renderError() {
        return (
            <ErrorMessage messageId='loadingFailed' />
        );
    }

    onDragStart(event: DragEvent, name: string) {
        console.info('Drag start: ', name);
        if (this.props.onDragStart) {
            this.props.onDragStart(event, name);
        }
    }

    onDragEnd() {
        if (this.props.onDragEnd) {
            this.props.onDragEnd();
        }
    }

    appMatchesFilter(app: MashroomAvailablePortalApp, filterRegExp: ?RegExp) {
        if (!filterRegExp) {
            return true;
        }
        if (app.name.match(filterRegExp)) {
            return true;
        }
        if (app.description && app.description.match(filterRegExp)) {
            return true;
        }
        return false;
    }

    getFilterRegExp() {
        if (!this.props.filter) {
            return null;
        }
        const escaped = escapeForRegExp(this.props.filter);
        return new RegExp(`(${escaped})`, 'ig');
    }

    renderAppList(apps: Array<MashroomAvailablePortalApp>, filterRegExp: ?RegExp): Array<Node> {
        return apps.map((app) => {
            let appName = escapeForHtml(app.name);
            let description = escapeForHtml(app.description || '');
            if (filterRegExp) {
                const filterReplacement = '<span class="filter-match">$1</span>';
                appName = appName.replace(filterRegExp, filterReplacement);
                description = description.replace(filterRegExp, filterReplacement);
            }

            return (
                <div key={app.name} className='available-app' onDragStart={(e) => this.onDragStart(e, app.name)} onDragEnd={this.onDragEnd.bind(this)} draggable>
                    <div className='app-name' dangerouslySetInnerHTML={{ __html: appName }}/>
                    <div className='app-description' dangerouslySetInnerHTML={{ __html: description }}/>
                </div>
            );
        });
    }

    renderAvailableApps() {
        const availableApps = this.props.availableApps.apps;
        if (!availableApps || !Array.isArray(availableApps)) {
            return null;
        }

        const filterRegExp = this.getFilterRegExp();

        const filteredAndGroupedByCategory = {};
        availableApps.forEach((app) => {
            const category = app.category || CATEGORY_NONE;
            if (category !== CATEGORY_HIDDEN && this.appMatchesFilter(app, filterRegExp)) {
                const group = filteredAndGroupedByCategory[category] || [];
                filteredAndGroupedByCategory[category] = group;
                group.push(app);
            }
        });

        const groupedApps = [];

        for (const category in filteredAndGroupedByCategory) {
            if (filteredAndGroupedByCategory.hasOwnProperty(category)) {
                const apps = filteredAndGroupedByCategory[category];
                groupedApps.push(
                    <div key={category} className='grouped-apps'>
                        <div className='app-category'>
                            {category !== CATEGORY_NONE ? <span>{category}</span> : <FormattedMessage id='uncategorized'/>}
                        </div>
                        {this.renderAppList(apps, filterRegExp)}
                    </div>
                );
            }
        }

        return (
            <div className='available-app-list-wrapper'>
                {groupedApps}
            </div>
        );
    }

    render() {
        let content = null;
        if (this.props.availableApps.loading) {
            content = this.renderLoading();
        } else if (this.props.availableApps.error || !this.props.availableApps.apps) {
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
