import React, {useRef, useCallback, useContext} from 'react';
import {Trans} from 'react-i18next';
import {
    Button,
    DialogButtons,
    DialogContent,
    ErrorMessage,
    Modal,
} from '@mashroom/mashroom-portal-ui-commons';
import {useDispatch, useSelector} from 'react-redux';
import { DIALOG_NAME_SITE_DELETE } from '../constants';
import {DependencyContext} from '../DependencyContext';
import {setSelectedSiteUpdatingError} from '../store/actions';
import type {State} from '../types';

export default () => {
    const closeRef = useRef<(() => void) | undefined>(undefined);
    const {sites, selectedSite} = useSelector((state: State) => state);
    const {portalAdminService} = useContext(DependencyContext);
    const dispatch = useDispatch();
    const setErrorUpdating = (error: boolean) => dispatch(setSelectedSiteUpdatingError(error));

    const handleClose = useCallback(() => {
        closeRef.current?.();
    }, []);

    const handleCloseRef = useCallback((cb: () => void) => {
        closeRef.current = cb;
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (!selectedSite || !selectedSite.siteId) {
            return;
        }

        setErrorUpdating(false);
        try {
            await portalAdminService.deleteSite(selectedSite.siteId);
            handleClose();
            if (selectedSite.siteId === portalAdminService.getCurrentSiteId()) {
                // If the current site is deleted, redirect to a safe default (e.g., homepage)
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Error deleting site!', error);
            setErrorUpdating(true);
        }
    }, [selectedSite?.siteId]);

    let dialogRenderContent: React.ReactNode;

    if (!selectedSite) {
        dialogRenderContent = null;
    } else if (selectedSite.errorUpdating) {
        dialogRenderContent = <ErrorMessage messageId='updateFailed' />;
    } else {
        const siteData = sites.sites.find((s) => s.siteId === selectedSite.siteId);
        const siteTitle = siteData?.title || '???';
        dialogRenderContent = (
            <>
                <DialogContent>
                    <Trans i18nKey='confirmDeleteSite' values={{ siteTitle }}/>
                </DialogContent>
                <DialogButtons>
                    <Button
                        id='delete'
                        labelId='delete'
                        onClick={handleConfirmDelete}
                    />
                    <Button
                        id='cancel'
                        labelId='cancel'
                        secondary
                        onClick={handleClose}
                    />
                </DialogButtons>
            </>
        );
    }

    return (
        <Modal
            appWrapperClassName='mashroom-portal-admin-app'
            className='site-delete-dialog'
            name={DIALOG_NAME_SITE_DELETE}
            titleId='deleteSite'
            width={400}
            closeRef={handleCloseRef}
        >
            {dialogRenderContent}
        </Modal>
    );
};
