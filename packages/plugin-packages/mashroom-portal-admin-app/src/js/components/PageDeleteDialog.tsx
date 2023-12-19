
import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';
import {
    Button,
    DialogButtons,
    DialogContent, ErrorMessage,
    Modal,
} from '@mashroom/mashroom-portal-ui-commons';
import {DIALOG_NAME_PAGE_DELETE} from '../constants';
import {getParentPage, removePageFromTree} from '../services/model-utils';

import type {ReactNode} from 'react';
import type {MashroomPortalAdminService} from '@mashroom/mashroom-portal/type-definitions';
import type {SelectedPage, Pages} from '../types';

type Props = {
    pages: Pages;
    selectedPage: SelectedPage | undefined | null;
    portalAdminService: MashroomPortalAdminService,
    setErrorUpdating: (error: boolean) => void
};

export default class PageDeleteDialog extends PureComponent<Props> {

    close: (() => void) | undefined;

    onClose(): void {
        this.close && this.close();
    }

    onCloseRef(close: () => void): void {
        this.close = close;
    }

    onConfirmDelete(): void {
        const {selectedPage, portalAdminService, setErrorUpdating, pages} = this.props;
        if (!selectedPage || !selectedPage.pageId) {
            return;
        }
        const { pageId  } = selectedPage;

        const promise = portalAdminService.getSite(portalAdminService.getCurrentSiteId()).then(
            (site) => {
                const siteClone = {...site, pages: [...site.pages]};

                const parentPage = getParentPage(pageId, pages.pagesFlattened);
                const parentPageId = parentPage ? parentPage.pageId : null;
                removePageFromTree(pageId, parentPageId, siteClone.pages, true);

                return Promise.all([
                    portalAdminService.deletePage(pageId),
                    portalAdminService.updateSite(siteClone)
                ]);
            }
        );

        promise.then(
            () => {
                this.onClose();
                if (selectedPage.pageId === portalAdminService.getCurrentPageId()) {
                    window.location.href = '/';
                } else {
                    window.location.reload();
                }
            },
            (error) => {
                console.error('Error deleting page!', error);
                setErrorUpdating(true);
            }
        );
    }

    renderUpdatingError(): ReactNode {
        return (
            <ErrorMessage messageId='updateFailed' />
        );
    }

    renderContent(): ReactNode {
        const {selectedPage, pages} = this.props;
        if (!selectedPage) {
            return null;
        }

        if (selectedPage.errorUpdating) {
            return this.renderUpdatingError();
        }

        const page = pages.pagesFlattened.find((p) => p.pageId === selectedPage.pageId);
        const pageTitle = page && page.title || '???';

        return (
            <>
                <DialogContent>
                   <FormattedMessage id='confirmDeletePage' values={{ pageTitle }}/>
                </DialogContent>
                <DialogButtons>
                    <Button id='cancel' labelId='cancel' secondary onClick={this.onClose.bind(this)}/>
                    <Button id='delete' labelId='delete' onClick={this.onConfirmDelete.bind(this)}/>
                </DialogButtons>
            </>
        );
    }

    render(): ReactNode {
        return (
            <Modal
                appWrapperClassName='mashroom-portal-admin-app'
                className='page-delete-dialog'
                name={DIALOG_NAME_PAGE_DELETE}
                titleId='deletePage'
                width={400}
                closeRef={this.onCloseRef.bind(this)}>
                {this.renderContent()}
            </Modal>
        );
    }

}
