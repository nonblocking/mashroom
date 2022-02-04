
import React from 'react';
import type {MashroomPortalPageRefLocalized} from '@mashroom/mashroom-portal/type-definitions';

type Props = {
    currentPage: MashroomPortalPageRefLocalized;
}

export default ({currentPage}: Props) => (
    <div className="menu-toggle-wrapper">
        <div id="menu-toggle" />
        <div className="current-page">{currentPage.title}</div>
    </div>
);
