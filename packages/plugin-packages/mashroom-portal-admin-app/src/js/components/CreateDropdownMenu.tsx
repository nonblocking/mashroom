import React, {useCallback, useRef} from 'react';
import { DropdownMenu, DropdownMenuItem, setShowModal } from '@mashroom/mashroom-portal-ui-commons';
import {useDispatch} from 'react-redux';
import { DIALOG_NAME_PAGE_CONFIGURE, DIALOG_NAME_SITE_CONFIGURE } from '../constants';
import {setSelectedPageNew, setSelectedSiteNew} from '../store/actions';

export default() => {
    const dispatch = useDispatch();
    const closeDropDownRef = useRef<(() => void) | undefined>(undefined);

    const handleCreatePage = useCallback(() => {
        closeDropDownRef.current?.();
        dispatch(setSelectedPageNew());
        dispatch(setShowModal(DIALOG_NAME_PAGE_CONFIGURE, true));
    }, [closeDropDownRef.current]);

    const handleCreateSite = useCallback(() => {
        closeDropDownRef.current?.();
        dispatch(setSelectedSiteNew());
        dispatch(setShowModal(DIALOG_NAME_SITE_CONFIGURE, true));
    }, [closeDropDownRef.current]);

    return (
        <DropdownMenu className='create-dropdown-menu' labelId='create' closeRef={(close) => closeDropDownRef.current = close}>
            <DropdownMenuItem labelId='createPage' onClick={handleCreatePage} />
            <DropdownMenuItem labelId='createNewSite' onClick={handleCreateSite} />
        </DropdownMenu>
    );
};
