import React, {useRef, useCallback, useContext} from 'react';
import {
    CircularProgress,
    DropdownMenu,
    ErrorMessage,
    setShowModal
} from '@mashroom/mashroom-portal-ui-commons';
import {useDispatch, useSelector} from 'react-redux';
import { DIALOG_NAME_SITE_CONFIGURE, DIALOG_NAME_SITE_DELETE } from '../constants';
import {setSelectedSite} from '../store/actions';
import {DependencyContext} from '../DependencyContext';

import type {
    MashroomPortalSiteLinkLocalized
} from '@mashroom/mashroom-portal/type-definitions';
import type {State} from '../types';

export default () => {
    const closeDropDownRef = useRef<(() => void) | undefined>(undefined);
    const {dataLoadingService} = useContext(DependencyContext);
    const {sites} = useSelector((state: State) => state);
    const dispatch = useDispatch();
    const showModal = (name: string) => dispatch(setShowModal(name, true));
    const initConfigureSite = (siteId: string) => dispatch(setSelectedSite(siteId));

    const handleOpen = useCallback(() => {
        dataLoadingService.loadSites();
    }, [dataLoadingService]);

    const handleGoto = useCallback((site: MashroomPortalSiteLinkLocalized) => {
        setTimeout(() => {
            global.location.href = site.url;
        }, 0);
    }, []);

    const handleConfigure = useCallback((site: MashroomPortalSiteLinkLocalized) => {
        closeDropDownRef.current?.();
        initConfigureSite(site.siteId);
        showModal(DIALOG_NAME_SITE_CONFIGURE);
    }, []);

    const handleDelete = useCallback((site: MashroomPortalSiteLinkLocalized) => {
        closeDropDownRef.current?.();
        initConfigureSite(site.siteId);
        showModal(DIALOG_NAME_SITE_DELETE);
    }, []);

    const callOnEnter = (
        event: React.KeyboardEvent<HTMLDivElement>,
        action: () => void
    ) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            action();
        }
    };

    let dropdownContent;

    if (sites.loading) {
        dropdownContent = <CircularProgress />;
    } else if (sites.error || !sites.sites) {
        dropdownContent = <ErrorMessage messageId='loadingFailed' />;
    } else if (sites.sites.length === 0) {
        dropdownContent = <div className='no-sites-available-message'>No sites available.</div>;
    } else {
        const siteItems = sites.sites.map((site) => (
            <div key={site.siteId} className='site'>
                <a
                    className='site-link'
                    href={site.url}
                    onClick={(e) => {
                        e.preventDefault();
                        handleGoto(site);
                    }}
                >
                    {site.title}
                </a>
                <div
                    className='configure'
                    onClick={() => handleConfigure(site)}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => callOnEnter(e, () => handleConfigure(site))}
                >
                    &nbsp; {/* Or an actual icon */}
                </div>
                {sites.sites.length > 1 && (
                    <div
                        className='delete'
                        onClick={() => handleDelete(site)}
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) => callOnEnter(e, () => handleDelete(site))}
                    >
                        &nbsp; {/* Or an actual icon */}
                    </div>
                )}
            </div>
        ));
        dropdownContent = <div className='sites'>{siteItems}</div>;
    }

    return (
        <DropdownMenu
            className='sites-dropdown-menu'
            labelId='sites'
            onOpen={handleOpen}
            closeRef={(ref) => (closeDropDownRef.current = ref)}
        >
            {dropdownContent}
        </DropdownMenu>
    );
};
