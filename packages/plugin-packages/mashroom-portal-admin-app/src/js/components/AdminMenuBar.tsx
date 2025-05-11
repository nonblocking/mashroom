
import React from 'react';
import SitesDropdownMenu from './SitesDropdownMenu';
import PortalAppControlsToggle from './PortalAppControlsToggle';
import PagesDropdownMenu from './PagesDropdownMenu';
import CreateDropdownMenu from './CreateDropdownMenu';
import AddAppDropdownMenu from './AddAppDropdownMenu';
import ConfigureDropdownMenu from './ConfigureDropdownMenu';

export default () => {
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
};
