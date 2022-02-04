
import React from 'react';
import Pages from './pages';
import MenuToggle from './menu_toggle';
import type {MashroomPortalPageRefLocalized} from '@mashroom/mashroom-portal/type-definitions';

type Props = {
    siteBasePath: string;
    currentPage: MashroomPortalPageRefLocalized;
    pages: Array<MashroomPortalPageRefLocalized>;
}

export default (props: Props) => (
    <nav>
        <MenuToggle currentPage={props.currentPage} />
        <div className="nav-wrapper">
            <Pages {...props} />
        </div>
    </nav>
);
