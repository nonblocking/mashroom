
import React, {PureComponent} from 'react';
import {DropdownMenu, DropdownMenuItem} from '@mashroom/mashroom-portal-ui-commons';
import {DIALOG_NAME_PAGE_CONFIGURE, DIALOG_NAME_SITE_CONFIGURE} from '../constants';

import type {ReactNode} from 'react';
import type {MashroomPortalAdminService} from '@mashroom/mashroom-portal/type-definitions';

type Props = {
    showModal: (name: string) => void,
    portalAdminService: MashroomPortalAdminService,
    initConfigureSite: (siteId: string) => void,
    initConfigurePage: (pageId: string) => void
};

export default class ConfigureDropdownMenu extends PureComponent<Props> {

    closeDropDownRef: (() => void) | undefined;

    onConfigurePage(): void {
        const {initConfigurePage, portalAdminService, showModal} = this.props;
        this.closeDropDownRef?.();
        initConfigurePage(portalAdminService.getCurrentPageId());
        showModal(DIALOG_NAME_PAGE_CONFIGURE);
    }

    onConfigureSite(): void {
        const {initConfigureSite, portalAdminService, showModal} = this.props;
        this.closeDropDownRef?.();
        initConfigureSite(portalAdminService.getCurrentSiteId());
        showModal(DIALOG_NAME_SITE_CONFIGURE);
    }

    render(): ReactNode {
        return (
            <DropdownMenu className='configure-dropdown-menu' labelId='configure' closeRef={(ref) => this.closeDropDownRef = ref}>
                <DropdownMenuItem labelId='configurePage' onClick={this.onConfigurePage.bind(this)}/>
                <DropdownMenuItem labelId='configureSite' onClick={this.onConfigureSite.bind(this)}/>
            </DropdownMenu>
        );
    }
}
