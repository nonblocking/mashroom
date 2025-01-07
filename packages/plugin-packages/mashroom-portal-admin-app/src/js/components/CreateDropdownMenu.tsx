
import React, {PureComponent} from 'react';
import {DropdownMenu, DropdownMenuItem} from '@mashroom/mashroom-portal-ui-commons';
import {DIALOG_NAME_PAGE_CONFIGURE, DIALOG_NAME_SITE_CONFIGURE} from '../constants';

import type {ReactNode} from 'react';

type Props = {
    showModal: (name: string) => void,
    initConfigureSite: () => void,
    initConfigurePage: () => void
};

export default class CreateDropdownMenu extends PureComponent<Props> {

    closeDropDownRef: (() => void) | undefined;

    onCreatePage(): void {
        const {initConfigurePage, showModal} = this.props;
        this.closeDropDownRef?.();
        initConfigurePage();
        showModal(DIALOG_NAME_PAGE_CONFIGURE);
    }

    onCreateSite(): void {
        const {initConfigureSite, showModal} = this.props;
        this.closeDropDownRef?.();
        initConfigureSite();
        showModal(DIALOG_NAME_SITE_CONFIGURE);
    }

    render(): ReactNode {
        return (
            <DropdownMenu className='create-dropdown-menu' labelId='create' closeRef={(ref) => this.closeDropDownRef = ref}>
                <DropdownMenuItem labelId='createPage' onClick={this.onCreatePage.bind(this)}/>
                <DropdownMenuItem labelId='createNewSite' onClick={this.onCreateSite.bind(this)}/>
            </DropdownMenu>
        );
    }
}
