
import React, {PureComponent} from 'react';
import SitesDropdownMenu from '../containers/SitesDropdownMenu';
import PagesDropdownMenu from '../containers/PagesDropdownMenu';
import ConfigureDropdownMenu from '../containers/ConfigureDropdownMenu';
import CreateDropdownMenu from '../containers/CreateDropdownMenu';
import AddAppDropdownMenu from '../containers/AddAppDropdownMenu';
import PortalAppControlsToggle from '../containers/PortalAppControlsToggle';

import type {ReactNode} from 'react';

type Props = {

};

export default class AdminMenuBar extends PureComponent<Props> {

    render(): ReactNode {
        return (
            <div className='admin-menu-bar'>
                <SitesDropdownMenu/>
                <PagesDropdownMenu/>
                <ConfigureDropdownMenu/>
                <CreateDropdownMenu/>
                <AddAppDropdownMenu/>
                <PortalAppControlsToggle/>
            </div>
        );
    }
}
