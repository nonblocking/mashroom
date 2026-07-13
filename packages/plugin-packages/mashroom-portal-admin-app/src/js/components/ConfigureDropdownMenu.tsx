import React, {useCallback, useContext, useRef} from 'react';
import { DropdownMenu, DropdownMenuItem} from '@mashroom/mashroom-portal-ui-commons';
import { DIALOG_NAME_PAGE_CONFIGURE, DIALOG_NAME_SITE_CONFIGURE } from '../constants';
import {setSelectedPage, setSelectedSite, setShowModal} from '../store/actions';
import {DependencyContext} from '../DependencyContext';
import useStore from '../store/useStore';

export default () => {
    const dispatch = useStore((state) => state.dispatch);
    const {portalAdminService} = useContext(DependencyContext);
    const closeDropDownRef = useRef<(() => void) | undefined>(undefined);

    const handleConfigurePage = useCallback(() => {
        closeDropDownRef.current?.();
        dispatch(setSelectedPage(portalAdminService.getCurrentPageId()));
        dispatch(setShowModal(DIALOG_NAME_PAGE_CONFIGURE, true));
    }, [closeDropDownRef.current]);

    const handleConfigureSite = useCallback(() => {
        closeDropDownRef.current?.();
        dispatch(setSelectedSite(portalAdminService.getCurrentSiteId()));
        dispatch(setShowModal(DIALOG_NAME_SITE_CONFIGURE, true));
    }, [closeDropDownRef.current]);

    return (
        <DropdownMenu className='configure-dropdown-menu' labelId='configure' closeRef={(close) => closeDropDownRef.current = close}>
            <DropdownMenuItem labelId='configurePage' onClick={handleConfigurePage} />
            <DropdownMenuItem labelId='configureSite' onClick={handleConfigureSite} />
        </DropdownMenu>
    );
};

