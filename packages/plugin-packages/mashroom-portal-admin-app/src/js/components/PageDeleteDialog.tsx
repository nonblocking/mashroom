
import React, {PureComponent, Fragment} from 'react';
import {FormattedMessage} from 'react-intl';
import {
    Button,
    DialogButtons,
    DialogContent, ErrorMessage,
    ModalContainer,
} from '@mashroom/mashroom-portal-ui-commons';
import {DIALOG_NAME_PAGE_DELETE} from '../constants';
import {getParentPage, removePageFromTree} from '../services/model_utils';

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

    onClose() {
        this.close && this.close();
    }

    onCloseRef(close: () => void) {
        this.close = close;
    }

    onConfirmDelete() {
        const selectedPage = this.props.selectedPage;
        if (!selectedPage || !selectedPage.pageId) {
            return null;
        }
        const pageId = selectedPage.pageId;

        const promise = this.props.portalAdminService.getSite(this.props.portalAdminService.getCurrentSiteId()).then(
            (site) => {
                const siteClone = {...site, pages: [...site.pages]};

                const parentPage = getParentPage(pageId, this.props.pages.pagesFlattened);
                const parentPageId = parentPage ? parentPage.pageId : null;
                removePageFromTree(pageId, parentPageId, siteClone.pages);

                return Promise.all([
                    this.props.portalAdminService.deletePage(pageId),
                    this.props.portalAdminService.updateSite(siteClone)
                ]);
            }
        );

        promise.then(
            () => {
                this.onClose();
                if (selectedPage.pageId === this.props.portalAdminService.getCurrentPageId()) {
                    window.location.href = '/';
                } else {
                    window.location.reload(true);
                }
            },
            (error) => {
                console.error('Error deleting page!', error);
                this.props.setErrorUpdating(true);
            }
        );
    }

    renderUpdatingError() {
        return (
            <ErrorMessage messageId='updateFailed' />
        );
    }

    renderContent() {
        const selectedPage = this.props.selectedPage;
        if (!selectedPage) {
            return null;
        }

        if (selectedPage.errorUpdating) {
            return this.renderUpdatingError();
        }

        const page = this.props.pages.pagesFlattened.find((p) => p.pageId === selectedPage.pageId);
        const pageTitle = page && page.title || '???';

        return (
            <Fragment>
                <DialogContent>
                   <FormattedMessage id='confirmDeletePage' values={{ pageTitle }}/>
                </DialogContent>
                <DialogButtons>
                    <Button id='cancel' labelId='cancel' onClick={this.onClose.bind(this)}/>
                    <Button id='delete' labelId='delete' onClick={this.onConfirmDelete.bind(this)}/>
                </DialogButtons>
            </Fragment>
        );
    }

    render() {
        return (
            <ModalContainer
                appWrapperClassName='mashroom-portal-admin-app'
                className='page-delete-dialog'
                name={DIALOG_NAME_PAGE_DELETE}
                titleId='deletePage'
                minWidth={300}
                closeRef={this.onCloseRef.bind(this)}>
                {this.renderContent()}
            </ModalContainer>
        );
    }

}
