
import React, {PureComponent} from 'react';
import SitesDropdownMenuContainer from '../containers/SitesDropdownMenuContainer';
import PagesDropdownMenuContainer from '../containers/PagesDropdownMenuContainer';
import ConfigureDropdownMenuContainer from '../containers/ConfigureDropdownMenuContainer';
import CreateDropdownMenuContainer from '../containers/CreateDropdownMenuContainer';
import AddAppDropdownMenuContainer from '../containers/AddAppDropdownMenuContainer';
import PortalAppControlsToggleContainer from '../containers/PortalAppControlsToggleContainer';

import type {ReactNode} from 'react';

type Props = {

};

export default class AdminMenuBar extends PureComponent<Props> {

    render(): ReactNode {
        return (
            <div className='admin-menu-bar'>
                <SitesDropdownMenuContainer/>
                <PagesDropdownMenuContainer/>
                <ConfigureDropdownMenuContainer/>
                <CreateDropdownMenuContainer/>
                <AddAppDropdownMenuContainer/>
                <PortalAppControlsToggleContainer/>
            </div>
        );
    }
}
