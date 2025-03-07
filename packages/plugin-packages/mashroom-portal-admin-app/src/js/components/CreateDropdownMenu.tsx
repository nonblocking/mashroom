
import React, {PureComponent} from 'react';
import {DropdownMenu, DropdownMenuItem} from '@mashroom/mashroom-portal-ui-commons';
import {DIALOG_NAME_PAGE_CONFIGURE, DIALOG_NAME_SITE_CONFIGURE} from '../constants';

type Props = {
    showModal: (name: string) => void,
    initConfigureSite: () => void,
    initConfigurePage: () => void
};

export default class CreateDropdownMenu extends PureComponent<Props> {

    closeDropDownRef: (() => void) | undefined;

    onCreatePage() {
        const {initConfigurePage, showModal} = this.props;
        this.closeDropDownRef?.();
        initConfigurePage();
        showModal(DIALOG_NAME_PAGE_CONFIGURE);
    }

    onCreateSite() {
        const {initConfigureSite, showModal} = this.props;
        this.closeDropDownRef?.();
        initConfigureSite();
        showModal(DIALOG_NAME_SITE_CONFIGURE);
    }

    render() {
        return (
            <DropdownMenu className='create-dropdown-menu' labelId='create' closeRef={(ref) => this.closeDropDownRef = ref}>
                <DropdownMenuItem labelId='createPage' onClick={this.onCreatePage.bind(this)}/>
                <DropdownMenuItem labelId='createNewSite' onClick={this.onCreateSite.bind(this)}/>
            </DropdownMenu>
        );
    }
}
