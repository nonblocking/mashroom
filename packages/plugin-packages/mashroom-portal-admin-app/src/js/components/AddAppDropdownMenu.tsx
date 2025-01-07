
import React, {PureComponent} from 'react';
import {DropdownMenu} from '@mashroom/mashroom-portal-ui-commons';
import AvailableAppsPanel from '../containers/AvailableAppsPanel';

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
        };
    }

    onOpen(): void {
        const {dataLoadingService} = this.props;
        dataLoadingService.loadAvailableApps(true);
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
        const {portalAppManagementService} = this.props;
        portalAppManagementService.prepareDrag(event as any, null, name);
        this.close?.();
    }

    onAppDragEnd(): void {
        const {portalAppManagementService} = this.props;
        portalAppManagementService.dragEnd();
    }

    onFilterChange(filter: string): void {
        this.setState({
            filter
        });
    }

    render(): ReactNode {
        const {intl} = this.props;
        const {filter} = this.state;
        const filterLabel = intl.formatMessage({ id: 'filter'});

        return (
            <DropdownMenu className='add-app-dropdown-menu' labelId='addApp' onOpen={this.onOpen.bind(this)} closeRef={this.onCloseRef.bind(this)}>
                <div className='add-app-content'>
                    <input type='search'
                           placeholder={filterLabel}
                           value={filter || ''}
                           onChange={(event) => this.onFilterChange(event.target.value)}
                           ref={(e) => this.inputElem = e}
                    />
                    <div className='app-list'>
                        <AvailableAppsPanel
                            onDragStart={this.onAppDragStart.bind(this)}
                            onDragEnd={this.onAppDragEnd.bind(this)}
                            filter={filter}/>
                    </div>
                </div>
            </DropdownMenu>
        );
    }
}


