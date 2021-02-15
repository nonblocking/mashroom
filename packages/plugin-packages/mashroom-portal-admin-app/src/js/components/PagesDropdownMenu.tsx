
import React, {PureComponent} from 'react';
import {CircularProgress, DropdownMenu, ErrorMessage} from '@mashroom/mashroom-portal-ui-commons';
import {DIALOG_NAME_PAGE_CONFIGURE, DIALOG_NAME_PAGE_DELETE} from '../constants';

import type {MashroomPortalAdminService, MashroomPortalSiteService} from '@mashroom/mashroom-portal/type-definitions';
import type {DataLoadingService, FlatPage, Pages} from '../types';

type Props = {
    pages: Pages;
    dataLoadingService: DataLoadingService;
    portalAdminService: MashroomPortalAdminService;
    portalSiteService: MashroomPortalSiteService;
    showModal: (name: string) => void;
    initConfigurePage: (pageId: string) => void;
};

const padWithSpaces = (nr: number) => {
    const items = [];
    for (let i = 0; i < nr; i++) {
        items.push(<span key={String(i)}>&nbsp;</span>);
    }
    return items;
};

export default class PagesDropdownMenu extends PureComponent<Props> {

    closeDropDownRef: (() => void) | undefined;

    onOpen() {
        this.props.dataLoadingService.loadPageTree();
    }

    onGoto(page: FlatPage) {
        const pageUrl = `${this.props.portalSiteService.getCurrentSiteUrl()}${page.friendlyUrl}`;
        setTimeout(() => {
            global.location.href = pageUrl;
        }, 0);
    }

    onConfigure(page: FlatPage) {
        this.closeDropDownRef && this.closeDropDownRef();
        this.props.initConfigurePage(page.pageId);
        this.props.showModal(DIALOG_NAME_PAGE_CONFIGURE);
    }

    onDelete(page: FlatPage) {
        this.closeDropDownRef && this.closeDropDownRef();
        this.props.initConfigurePage(page.pageId);
        this.props.showModal(DIALOG_NAME_PAGE_DELETE);
    }

    renderLoading() {
        return (
            <CircularProgress/>
        );
    }

    renderError() {
        return (
            <ErrorMessage messageId='loadingFailed' />
        );
    }

    renderContent() {
        if (this.props.pages.loading) {
            return this.renderLoading();
        } else if (this.props.pages.error || !this.props.pages.pages) {
            return this.renderError();
        }

        const items = this.props.pages.pagesFlattened.map((page) => (
            <div key={page.pageId} className='page'>
                <div className='portal-page-link'>
                    {padWithSpaces(page.level * 2)}
                    <a href='javascript:void(0)' onClick={this.onGoto.bind(this, page)}>{page.title}</a>
                </div>
                <div className='configure' onClick={this.onConfigure.bind(this, page)}>&nbsp;</div>
                <div className='delete' onClick={this.onDelete.bind(this, page)}>&nbsp;</div>
            </div>
        ));

        return (
            <div className='pages'>
                {items}
            </div>
        );
    }

    render() {
        return (
            <DropdownMenu className='pages-dropdown-menu' labelId='pages' onOpen={this.onOpen.bind(this)} closeRef={(ref) => this.closeDropDownRef = ref}>
                {this.renderContent()}
            </DropdownMenu>
        );
    }
}
