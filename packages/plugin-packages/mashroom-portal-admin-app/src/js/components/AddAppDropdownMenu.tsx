
import React, {PureComponent} from 'react';
import {DropdownMenu} from '@mashroom/mashroom-portal-ui-commons';
import AvailableAppsPanelContainer from '../containers/AvailableAppsPanelContainer';

import type {DragEvent} from 'react';
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

    onOpen() {
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

    onCloseRef(close: () => void) {
        this.close = close;
    }

    onAppDragStart(event: DragEvent, name: string) {
        this.props.portalAppManagementService.prepareDrag(event as any, null, name);
        this.close && this.close();
    }

    onAppDragEnd() {
        this.props.portalAppManagementService.dragEnd();
    }

    onFilterChange(filter: string) {
        this.setState({
            filter
        });
    }

    render() {
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


