import React, {useRef, useCallback, useContext} from 'react';
import {Trans} from 'react-i18next';
import {
    Button,
    DialogButtons,
    DialogContent,
    ErrorMessage,
    Modal,
} from '@mashroom/mashroom-portal-ui-commons';
import {DependencyContext} from '../DependencyContext';
import {setSelectedSiteUpdatingError, setShowModal} from '../store/actions';
import useStore from '../store/useStore';
import {DIALOG_NAME_SITE_DELETE} from '../constants';

export default () => {
    const closeRef = useRef<(() => void) | undefined>(undefined);
    const sites = useStore((state) => state.sites);
    const selectedSite = useStore((state) => state.selectedSite);
    const showModal = useStore((state) => !!state.modals[DIALOG_NAME_SITE_DELETE]?.show);
    const dispatch = useStore((state) => state.dispatch);
    const {portalAdminService} = useContext(DependencyContext);
    const setErrorUpdating = (error: boolean) => dispatch(setSelectedSiteUpdatingError(error));
    const closeModal = () => dispatch(setShowModal(DIALOG_NAME_SITE_DELETE, false));

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
            show={showModal}
            close={closeModal}
            titleId='deleteSite'
            width={400}
            closeRef={handleCloseRef}
        >
            {dialogRenderContent}
        </Modal>
    );
};
