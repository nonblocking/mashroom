
import React, {PureComponent} from 'react';
import {DropdownMenu} from '@mashroom/mashroom-portal-ui-commons';
import AvailableAppsPanelContainer from '../containers/AvailableAppsPanelContainer';

import type {ReactNode, DragEvent} from 'react';
import type {IntlShape} from 'react-intl';
import type {PortalAppManagementService, DataLoadingService} from '../types';

type Props = {
    dataLoadingService: DataLoadingService;
    portalAppManagementService: PortalAppManagementService;
    intl: IntlShape;
};

type State = {
    filter: string | undefined | null;
}

export default class AddAppDropdownMenu extends PureComponent<Props, State> {

    close: (() => void) | undefined;
    inputElem: HTMLInputElement | null | undefined;

    constructor(props: Props) {
        super(props);
        this.state = {
            filter: null
        }
    }

    onOpen(): void {
        this.props.dataLoadingService.loadAvailableApps(true);
        this.setState({
            filter: null
        });
        setTimeout(() => {
            if (this.inputElem) {
                this.inputElem.focus();
            }
        }, 0);

    }

    onCloseRef(close: () => void): void {
        this.close = close;
    }

    onAppDragStart(event: DragEvent, name: string): void {
        this.props.portalAppManagementService.prepareDrag(event as any, null, name);
        if (window.sessionStorage) {
            const { sessionStorage } = window;

            let recentlyAddedApps: string[] = [];
            let recentlyAddedAppsSet = new Set();
            try {
                recentlyAddedApps = JSON.parse(sessionStorage.getItem('__recentlyAddedApps__') || '[]');
                recentlyAddedAppsSet = new Set(recentlyAddedApps);
            } catch (e) {
                // IGNORE
            }

            recentlyAddedAppsSet.add(name);

            sessionStorage.setItem('__recentlyAddedApps__', JSON.stringify(Array.from(recentlyAddedAppsSet)));
        }
        this.close && this.close();
    }

    onAppDragEnd(): void {
        this.props.portalAppManagementService.dragEnd();
    }

    onFilterChange(filter: string): void {
        this.setState({
            filter
        });
    }

    render(): ReactNode {
        const filterLabel = this.props.intl.formatMessage({ id: 'filter'});

        return (
            <DropdownMenu className='add-app-dropdown-menu' labelId='addApp' onOpen={this.onOpen.bind(this)} closeRef={this.onCloseRef.bind(this)}>
                <div className='add-app-content'>
                    <input type='search'
                           placeholder={filterLabel}
                           value={this.state.filter || ''}
                           onChange={(event) => this.onFilterChange(event.target.value)}
                           ref={(e) => this.inputElem = e}
                    />
                    <div className='app-list'>
                        <AvailableAppsPanelContainer
                            onDragStart={this.onAppDragStart.bind(this)}
                            onDragEnd={this.onAppDragEnd.bind(this)}
                            filter={this.state.filter}/>
                    </div>
                </div>
            </DropdownMenu>
        );
    }
}


