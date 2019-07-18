// @flow

import React, {PureComponent, Fragment} from 'react';
import {FormattedMessage} from 'react-intl';
import {
    Button,
    DialogButtons,
    DialogContent, ErrorMessage,
    ModalContainer,
} from '@mashroom/mashroom-portal-ui-commons';
import {DIALOG_NAME_SITE_DELETE} from '../constants';

import type {MashroomPortalAdminService} from '@mashroom/mashroom-portal/type-definitions';
import type {Sites, SelectedSite} from '../../../type-definitions';

type Props = {
    sites: Sites,
    selectedSite: ?SelectedSite,
    portalAdminService: MashroomPortalAdminService,
    setErrorUpdating: (boolean) => void
};

export default class SiteDeleteDialog extends PureComponent<Props> {

    close: () => void;

    onClose() {
        this.close && this.close();
    }

    onCloseRef(close: () => void) {
        this.close = close;
    }

    onConfirmDelete() {
        const selectedSite = this.props.selectedSite;
        if (!selectedSite || !selectedSite.siteId) {
            return null;
        }

        this.props.portalAdminService.deleteSite(selectedSite.siteId).then(
            () => {
                this.onClose();
                if (selectedSite.siteId === this.props.portalAdminService.getCurrentSiteId()) {
                    window.location.href = '/';
                }
            },
            (error) => {
                console.error('Error deleting site!', error);
                this.props.setErrorUpdating(true);
            }
        );
    }

    renderUpdatingError() {
        return (
            <ErrorMessage>
                <FormattedMessage id='updateFailed'/>
            </ErrorMessage>
        );
    }

    renderContent() {
        const selectedSite = this.props.selectedSite;
        if (!selectedSite) {
            return null;
        }

        if (selectedSite.errorUpdating) {
            return this.renderUpdatingError();
        }

        const site = this.props.sites.sites.find((s) => s.siteId === selectedSite.siteId);
        const siteTitle = site && site.title || '???';

        return (
            <Fragment>
                <DialogContent>
                   <FormattedMessage id='confirmDeleteSite' values={{ siteTitle }}/>
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
                className='site-delete-dialog'
                name={DIALOG_NAME_SITE_DELETE}
                titleId='deleteSite'
                minWidth={300}
                closeRef={this.onCloseRef.bind(this)}>
                {this.renderContent()}
            </ModalContainer>
        );
    }

}
