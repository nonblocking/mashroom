
import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';
import {
    Button,
    DialogButtons,
    DialogContent, ErrorMessage,
    Modal,
} from '@mashroom/mashroom-portal-ui-commons';
import {DIALOG_NAME_SITE_DELETE} from '../constants';

import type {MashroomPortalAdminService} from '@mashroom/mashroom-portal/type-definitions';
import type {Sites, SelectedSite} from '../types';

type Props = {
    sites: Sites;
    selectedSite: SelectedSite | undefined | null;
    portalAdminService: MashroomPortalAdminService;
    setErrorUpdating: (error: boolean) => void;
};

export default class SiteDeleteDialog extends PureComponent<Props> {

    close: (() => void) | undefined;

    onClose() {
        this.close?.();
    }

    onCloseRef(close: () => void) {
        this.close = close;
    }

    onConfirmDelete() {
        const {selectedSite, portalAdminService, setErrorUpdating} = this.props;
        if (!selectedSite || !selectedSite.siteId) {
            return;
        }

        portalAdminService.deleteSite(selectedSite.siteId).then(
            () => {
                this.onClose();
                if (selectedSite.siteId === portalAdminService.getCurrentSiteId()) {
                    window.location.href = '/';
                }
            },
            (error) => {
                console.error('Error deleting site!', error);
                setErrorUpdating(true);
            }
        );
    }

    renderUpdatingError() {
        return (
            <ErrorMessage messageId='updateFailed' />
        );
    }

    renderContent() {
        const {selectedSite, sites} = this.props;
        if (!selectedSite) {
            return null;
        }

        if (selectedSite.errorUpdating) {
            return this.renderUpdatingError();
        }

        const site = sites.sites.find((s) => s.siteId === selectedSite.siteId);
        const siteTitle = site && site.title || '???';

        return (
            <>
                <DialogContent>
                   <FormattedMessage id='confirmDeleteSite' values={{ siteTitle }}/>
                </DialogContent>
                <DialogButtons>
                    <Button id='delete' labelId='delete' onClick={this.onConfirmDelete.bind(this)}/>
                    <Button id='cancel' labelId='cancel' secondary onClick={this.onClose.bind(this)}/>
                </DialogButtons>
            </>
        );
    }

    render() {
        return (
            <Modal
                appWrapperClassName='mashroom-portal-admin-app'
                className='site-delete-dialog'
                name={DIALOG_NAME_SITE_DELETE}
                titleId='deleteSite'
                width={400}
                closeRef={this.onCloseRef.bind(this)}>
                {this.renderContent()}
            </Modal>
        );
    }

}
