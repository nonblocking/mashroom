
import React, {PureComponent} from 'react';
import {change} from 'redux-form';

import {
    Button,
    CheckboxFieldContainer,
    CircularProgress,
    DialogButtons,
    DialogContent,
    ErrorMessage,
    Form,
    FormCell,
    FormRow,
    ModalContainer,
    SelectFieldContainer,
    SourceCodeEditorFieldContainer,
    TabDialogContainer,
    TextareaFieldContainer,
    TextFieldContainer
} from '@mashroom/mashroom-portal-ui-commons';
import Permissions from './Permissions';
import PagePositionSelection from './PagePositionSelection';
import I18NStringFieldContainer from '../containers/I18NStringFieldContainer';
import {DIALOG_NAME_PAGE_CONFIGURE} from '../constants';
import {getPagePosition, getParentPage, insertOrUpdatePageAtPosition, searchPageRef} from '../services/model_utils';

import type {ReactNode} from 'react';
import type {Dispatch} from 'redux';
import type {
    MashroomAvailablePortalLayout,
    MashroomAvailablePortalTheme,
    MashroomPortalAdminService,
    MashroomPortalPage,
    MashroomPortalPageRef,
    MashroomPortalSiteService
} from '@mashroom/mashroom-portal/type-definitions';
import type {SelectFieldOptions} from '@mashroom/mashroom-portal-ui-commons/type-definitions';
import type {DataLoadingService, Languages, PagePosition, Pages, SelectedPage} from '../types';

type Props = {
    languages: Languages;
    pages: Pages;
    availableThemes: Array<MashroomAvailablePortalTheme>;
    availableLayouts: Array<MashroomAvailablePortalLayout>;
    selectedPage: SelectedPage | undefined | null;
    dataLoadingService: DataLoadingService;
    portalAdminService: MashroomPortalAdminService;
    portalSiteService: MashroomPortalSiteService;
    setLoading: (loading: boolean) => void;
    setErrorLoading: (error: boolean) => void;
    setErrorUpdating: (error: boolean) => void;
    setPage: (page: MashroomPortalPage) => void;
    setPageRef: (ref: MashroomPortalPageRef | undefined | null) => void;
    setPermittedRoles: (roles: Array<string> | undefined | null) => void;
};

type FormValues = {
    page: Partial<MashroomPortalPage & MashroomPortalPageRef>;
    position: PagePosition;
    roles: Array<string> | undefined | null;
}

export default class PageConfigureDialog extends PureComponent<Props> {

    close: (() => void) | undefined;

    componentDidUpdate(prevProps: Props): void {
        if (this.props.selectedPage && (!prevProps.selectedPage || this.props.selectedPage.selectedTs !== prevProps.selectedPage.selectedTs)) {
            const pageId = this.props.selectedPage.pageId;
            const promises = [];

            promises.push(this.props.dataLoadingService.loadAvailableLanguages());
            promises.push(this.props.dataLoadingService.loadAvailableThemes());
            promises.push(this.props.dataLoadingService.loadAvailableLayouts());
            promises.push(this.props.dataLoadingService.loadPageTree());

            if (pageId) {
                promises.push(this.props.portalAdminService.getPage(pageId).then(
                    (page) => {
                        this.props.setPage(page);
                    }
                ));
                promises.push(this.props.portalAdminService.getPagePermittedRoles(pageId).then(
                    (roles) => {
                        this.props.setPermittedRoles(roles);
                    }
                ));
            }

            promises.push(this.props.portalAdminService.getSite(this.props.portalAdminService.getCurrentSiteId()).then(
                (site) => {
                    if (pageId) {
                        const pageRef = searchPageRef(pageId, site.pages);
                        if (pageRef) {
                            this.props.setPageRef(pageRef);
                        } else {
                            return Promise.reject(`No pageRef found for pageId: ${pageId}`);
                        }
                    }
                }
            ));

            Promise.all(promises).then(
                () => {
                    this.props.setLoading(false);
                },
                (error) => {
                    console.error(error);
                    this.props.setErrorLoading(true);
                }
            )
        }
    }

    onClose(): void {
        this.close && this.close();
    }

    onCloseRef(close: () => void): void {
        this.close = close;
    }

    onSubmit(values: FormValues): void {
        const selectedPage = this.props.selectedPage;
        if (!selectedPage) {
            return;
        }

        const pageId = selectedPage.pageId;

        const page: MashroomPortalPage = {
            pageId: pageId || '',
            description: values.page.description,
            keywords: values.page.keywords,
            theme: values.page.theme,
            layout: values.page.layout,
            extraCss: values.page.extraCss,
            portalApps: values.page.portalApps
        };

        let pageRef: MashroomPortalPageRef = {
            pageId: pageId || '',
            title: values.page.title || '',
            friendlyUrl: values.page.friendlyUrl || '',
            hidden: values.page.hidden,
            subPages: values.page.subPages
        };

        const promise = this.props.portalAdminService.getSite(this.props.portalAdminService.getCurrentSiteId()).then(
            (site) => {
                const siteClone = {...site, pages: [...site.pages]};

                let parentPageId: string | undefined | null;
                const updatePageRef = () => {
                    insertOrUpdatePageAtPosition(pageRef, siteClone.pages, values.position, parentPageId);
                    return this.props.portalAdminService.updateSite(siteClone);
                };

                const updatePagePermittedRoles = (pageId: string) => {
                    return this.props.portalAdminService.updatePagePermittedRoles(pageId, values.roles);
                };

                if (pageId) {
                    const parentPage = getParentPage(pageId, this.props.pages.pagesFlattened);
                    parentPageId = parentPage ? parentPage.pageId : null;

                    return this.props.portalAdminService.updatePage(page).then(
                        () => {
                            return Promise.all([updatePageRef(), updatePagePermittedRoles(pageId)]);
                        }
                    );
                } else {
                    return this.props.portalAdminService.addPage(page).then(
                        (page) => {
                            pageRef = {...pageRef, pageId: page.pageId};

                            return Promise.all([updatePageRef(), updatePagePermittedRoles(page.pageId)]);
                        }
                    );
                }
            }
        );

        promise.then(
            () => {
                this.onClose();
                if (pageId === this.props.portalAdminService.getCurrentPageId() && selectedPage.pageRef && selectedPage.pageRef.friendlyUrl !== pageRef.friendlyUrl) {
                    // Friendly URL changed
                    const url = window.location.href.replace(selectedPage.pageRef.friendlyUrl, pageRef.friendlyUrl);
                    window.location.href = url;
                } else {
                    if (!pageId) {
                        // Goto new page
                        const url = `${this.props.portalSiteService.getCurrentSiteUrl()}${pageRef.friendlyUrl}`;
                        window.location.href = url;
                    } else {
                        window.location.reload(true);
                    }
                }
            },
            (error) => {
                console.error('Updating page failed!', error);
                this.props.setErrorUpdating(true);
            }
        )
    }

    getInitialValues(): FormValues | null {
        const selectedPage = this.props.selectedPage;
        if (!selectedPage) {
            return null;
        }

        const pageId = selectedPage.pageId;
        let page = {};
        let position = null;

        if (pageId) {
            page = {...selectedPage.page, ...selectedPage.pageRef};
            position = getPagePosition(pageId, this.props.pages.pagesFlattened, this.props.pages.pages);
        } else {
            position = {
                parentPageId: null,
                insertAfterPageId: null
            };
        }

        return {
            page,
            position,
            roles: selectedPage.permittedRoles
        };
    }

    onChange(values: FormValues, dispatch: Dispatch<any>, props: any, previousValues: FormValues): void {

        // Set friendlyUrl automatically based on the title for a new page
        if (values.page && previousValues.page && props.initialValues.page && !props.initialValues.page.friendlyUrl) {
            const title = typeof (values.page.title) === 'object' ? values.page.title[this.props.languages.default] : values.page.title;
            const previousTitle = typeof (previousValues.page.title) === 'object' ? previousValues.page.title[this.props.languages.default] : previousValues.page.title;

            if (title && title !== previousTitle) {
                let friendlyUrl = title.replace(/[ -]/g, '_').toLowerCase();
                if (friendlyUrl && friendlyUrl.indexOf('/') !== 0) {
                    friendlyUrl = `/${friendlyUrl}`;
                }
                dispatch(change(props.form, 'page.friendlyUrl', friendlyUrl));
            }
        }
    }

    validate(values: FormValues): any {
        const errors: any = {
            page: {}
        };
        if (!values.page) {
            return errors;
        }

        const title = typeof (values.page.title) === 'object' ? values.page.title[this.props.languages.default] : values.page.title;
        if (!title || title.trim() === '') {
            errors.page.title = 'required';
        }
        if (!values.page.friendlyUrl || values.page.friendlyUrl.trim() === '') {
            errors.page.friendlyUrl = 'required';
        } else if (values.page.friendlyUrl.indexOf('/') !== 0) {
            errors.page.friendlyUrl = 'mustStartWithSlash';
        } else if (this.props.pages.pagesFlattened.find((page) => (!this.props.selectedPage || page.pageId !== this.props.selectedPage.pageId) && page.friendlyUrl.toLowerCase() === values.page.friendlyUrl?.toLowerCase())) {
            errors.page.friendlyUrl = 'pathAlreadyExists';
        }

        return errors;
    }

    renderPageGeneral(): ReactNode {
        const selectedPage = this.props.selectedPage;
        if (!selectedPage) {
            return null;
        }

        return (
            <DialogContent>
                <FormRow>
                    <FormCell>
                        <I18NStringFieldContainer id='title' name='page.title' labelId='title'/>
                    </FormCell>
                </FormRow>
                <FormRow>
                    <FormCell>
                        <TextFieldContainer id='friendlyUrl' name='page.friendlyUrl' labelId='friendlyUrl'/>
                    </FormCell>
                </FormRow>
                <FormRow>
                    <FormCell>
                        <CheckboxFieldContainer id='hidden' name='page.hidden' labelId='hideInNavigation'/>
                    </FormCell>
                </FormRow>
                <PagePositionSelection pageId={selectedPage.pageId} pages={this.props.pages.pagesFlattened}/>
            </DialogContent>
        );
    }

    renderPageAppearance(): ReactNode {
        let availableThemesOptions: SelectFieldOptions = [{
            value: null,
            label: '<Site Default>'
        }];
        availableThemesOptions = availableThemesOptions.concat(this.props.availableThemes.map((theme) => ({
            value: theme.name,
            label: theme.name
        })));
        let availableLayoutsOptions: SelectFieldOptions = [{
            value: null,
            label: '<Site Default>'
        }];
        availableLayoutsOptions = availableLayoutsOptions.concat(this.props.availableLayouts.map((layout) => ({
            value: layout.name,
            label: layout.name
        })));

        return (
            <DialogContent>
                <FormRow>
                    <FormCell>
                        <SelectFieldContainer id='theme' name='page.theme' labelId='theme'
                                              options={availableThemesOptions}/>
                    </FormCell>
                </FormRow>
                <FormRow>
                    <FormCell>
                        <SelectFieldContainer id='layout' name='page.layout' labelId='layout'
                                              options={availableLayoutsOptions}/>
                    </FormCell>
                </FormRow>
                <FormRow>
                    <FormCell>
                        <SourceCodeEditorFieldContainer labelId='extraCss' name='page.extraCss' language='css'/>
                    </FormCell>
                </FormRow>
            </DialogContent>
        );
    }

    renderPageSEO(): ReactNode {
        return (
            <DialogContent>
                <FormRow>
                    <FormCell>
                        <TextFieldContainer id='keywords' name='page.keywords' labelId='keywords'/>
                    </FormCell>
                </FormRow>
                <FormRow>
                    <FormCell>
                        <TextareaFieldContainer id='description' name='page.description' labelId='description'
                                                rows={5}/>
                    </FormCell>
                </FormRow>
            </DialogContent>
        );
    }

    renderPagePermissions(): ReactNode {
        return (
            <DialogContent>
                <Permissions/>
            </DialogContent>
        );
    }

    renderTabDialog(): ReactNode {
        return (
            <TabDialogContainer name='page-configure' tabs={[
                {name: 'general', titleId: 'general', content: this.renderPageGeneral()},
                {name: 'appearance', titleId: 'appearance', content: this.renderPageAppearance()},
                {name: 'SEO', titleId: 'SEO', content: this.renderPageSEO()},
                {name: 'permissions', titleId: 'permissions', content: this.renderPagePermissions()},
            ]}/>
        );
    }

    renderActions(): ReactNode {
        return (
            <DialogButtons>
                <Button id='cancel' labelId='cancel' onClick={this.onClose.bind(this)}/>
                <Button id='save' type='submit' labelId='save'/>
            </DialogButtons>
        );
    }

    renderLoading(): ReactNode {
        return (
            <CircularProgress/>
        );
    }

    renderLoadingError(): ReactNode {
        return (
            <div className='error-panel'>
                <ErrorMessage messageId='loadingFailed'/>
            </div>
        );
    }

    renderUpdatingError(): ReactNode {
        return (
            <div className='error-panel'>
                <ErrorMessage messageId='updateFailed'/>
            </div>
        );
    }

    renderContent(): ReactNode {
        const selectedPage = this.props.selectedPage;
        if (!selectedPage) {
            return null;
        }
        if (selectedPage.loading) {
            return this.renderLoading();
        } else if (selectedPage.errorLoading) {
            return this.renderLoadingError();
        } else if (selectedPage.errorUpdating) {
            return this.renderUpdatingError();
        }

        return (
            <Form formId='page-configure'
                  initialValues={this.getInitialValues()}
                  validator={this.validate.bind(this)}
                  onChange={this.onChange.bind(this)}
                  onSubmit={this.onSubmit.bind(this)}>
                {this.renderTabDialog()}
                {this.renderActions()}
            </Form>
        );
    }

    render(): ReactNode {
        return (
            <ModalContainer
                appWrapperClassName='mashroom-portal-admin-app'
                className='page-configure-dialog'
                name={DIALOG_NAME_PAGE_CONFIGURE}
                titleId='configurePage'
                minWidth={500}
                minHeight={400}
                closeRef={this.onCloseRef.bind(this)}>
                {this.renderContent()}
            </ModalContainer>
        );
    }

}
