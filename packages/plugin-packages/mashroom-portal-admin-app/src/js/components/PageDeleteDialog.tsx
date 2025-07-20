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
import { DIALOG_NAME_PAGE_DELETE } from '../constants';
import { getParentPage, removePageFromTree } from '../services/model-utils';
import {setSelectedPageUpdatingError} from '../store/actions';
import {DependencyContext} from '../DependencyContext';

import type {State} from '../types';

export default () => {
    const closeRef = useRef<(() => void) | undefined>(undefined);
    const {pages, selectedPage} = useSelector((state: State) => state);
    const dispatch = useDispatch();
    const setErrorUpdating = (error: boolean) => dispatch(setSelectedPageUpdatingError(error));
    const {portalAdminService, portalSiteService} = useContext(DependencyContext);

    const handleClose = useCallback(() => {
        closeRef.current?.();
    }, []);

    const handleCloseRef = useCallback((cb: () => void) => {
        closeRef.current = cb;
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (!selectedPage || !selectedPage.pageId) {
            return;
        }
        const { pageId } = selectedPage;

        setErrorUpdating(false);

        try {
            const site = await portalAdminService.getSite(portalAdminService.getCurrentSiteId());

            // Deep clone the pages array to ensure mutations don't affect original state unexpectedly
            const siteClone = { ...site, pages: JSON.parse(JSON.stringify(site.pages)) };

            const parentPage = getParentPage(pageId, pages.pagesFlattened);
            const parentPageId = parentPage ? parentPage.pageId : null;
            removePageFromTree(pageId, parentPageId, siteClone.pages, true);

            await Promise.all([
                portalAdminService.deletePage(pageId),
                portalAdminService.updateSite(siteClone),
            ]);

            handleClose();
            if (selectedPage.pageId === portalAdminService.getCurrentPageId()) {
                // If current page is deleted, redirect to a safe default (e.g., homepage)
                window.location.href = portalSiteService.getCurrentSiteUrl() || '/';
            } else {
                // Reload to reflect changes in navigation/site structure
                window.location.reload();
            }
        } catch (error) {
            console.error('Error deleting page!', error);
            setErrorUpdating(true);
        }
    }, [selectedPage?.pageId]);

    let content = null;
    if (selectedPage) {
        if (selectedPage.errorUpdating) {
            content = (
                <ErrorMessage messageId='updateFailed' />
            );
        }

        const pageToDelete = pages.pagesFlattened.find((p) => p.pageId === selectedPage.pageId);
        const pageTitle = pageToDelete?.title || '???';

        content = (
            <>
                <DialogContent>
                    <Trans i18nKey='confirmDeletePage' values={{ pageTitle }}/>
                </DialogContent>
                <DialogButtons>
                    <Button id='delete' labelId='delete' onClick={handleConfirmDelete}/>
                    <Button id='cancel' labelId='cancel' secondary onClick={handleClose}/>
                </DialogButtons>
            </>
        );
    }

    return (
        <Modal
            appWrapperClassName='mashroom-portal-admin-app'
            className='page-delete-dialog'
            name={DIALOG_NAME_PAGE_DELETE}
            titleId='deletePage'
            width={400}
            closeRef={handleCloseRef}
        >
            {content}
        </Modal>
    );
};
