
import React, {PureComponent} from 'react';
import {CircularProgress, DropdownMenu, ErrorMessage} from '@mashroom/mashroom-portal-ui-commons';
import {DIALOG_NAME_SITE_CONFIGURE, DIALOG_NAME_SITE_DELETE} from '../constants';

import type {ReactNode} from 'react';
import type {
    MashroomPortalAdminService,
    MashroomPortalSiteLinkLocalized
} from '@mashroom/mashroom-portal/type-definitions';
import type {DataLoadingService, Sites} from '../types';

type Props = {
    sites: Sites;
    dataLoadingService: DataLoadingService;
    portalAdminService: MashroomPortalAdminService;
    showModal: (name: string) => void;
    initConfigureSite: (siteId: string) => void;
};

export default class SitesDropdownMenu extends PureComponent<Props> {

    closeDropDownRef: (() => void) | undefined;

    onOpen(): void {
        const {dataLoadingService} = this.props;
        dataLoadingService.loadSites();
    }

    onGoto(site: MashroomPortalSiteLinkLocalized): void {
        setTimeout(() => {
            global.location.href = site.url;
        }, 0);
    }

    onConfigure(site: MashroomPortalSiteLinkLocalized): void {
        const {initConfigureSite, showModal} = this.props;
        this.closeDropDownRef && this.closeDropDownRef();
        initConfigureSite(site.siteId);
        showModal(DIALOG_NAME_SITE_CONFIGURE);
    }

    onDelete(site: MashroomPortalSiteLinkLocalized): void {
        const {initConfigureSite, showModal} = this.props;
        this.closeDropDownRef && this.closeDropDownRef();
        initConfigureSite(site.siteId);
        showModal(DIALOG_NAME_SITE_DELETE);
    }

    renderLoading(): ReactNode {
        return (
            <CircularProgress/>
        );
    }

    renderError(): ReactNode {
        return (
            <ErrorMessage messageId='loadingFailed' />
        );
    }

    renderContent(): ReactNode {
        const {sites} = this.props;
        if (sites.loading) {
            return this.renderLoading();
        } else if (sites.error || !sites.sites) {
            return this.renderError();
        }

        const items = sites.sites.map((site) => (
            <div key={site.siteId} className='site'>
                <a className='site-link' href='javascript:void(0)' onClick={this.onGoto.bind(this, site)}>{site.title}</a>
                <div className='configure' onClick={this.onConfigure.bind(this, site)}>&nbsp;</div>
                {sites.sites.length > 1 && <div className='delete' onClick={this.onDelete.bind(this, site)}>&nbsp;</div>}
            </div>
        ));

        return (
            <div className='sites'>
                {items}
            </div>
        );
    }

    render(): ReactNode {
        return (
            <DropdownMenu className='sites-dropdown-menu' labelId='sites' onOpen={this.onOpen.bind(this)} closeRef={(ref) => this.closeDropDownRef = ref}>
                {this.renderContent()}
            </DropdownMenu>
        );
    }
}
