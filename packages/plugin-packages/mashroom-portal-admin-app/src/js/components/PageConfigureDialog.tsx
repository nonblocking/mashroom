
import React, {PureComponent} from 'react';
import latinize from 'latinize';
import {
    Button,
    CheckboxField,
    CircularProgress,
    DialogButtons,
    DialogContent,
    ErrorMessage,
    Form,
    FormCell,
    FormRow,
    Modal,
    SelectField,
    SourceCodeEditorField,
    TabDialog,
    TextareaField,
    TextField
} from '@mashroom/mashroom-portal-ui-commons';
import I18NStringField from '../containers/I18NStringField';
import {DIALOG_NAME_PAGE_CONFIGURE} from '../constants';
import {getPagePosition, getParentPage, insertOrUpdatePageAtPosition, searchPageRef} from '../services/model_utils';
import PagePositionSelection from './PagePositionSelection';
import Permissions from './Permissions';

import type {ReactNode} from 'react';
import type {
    MashroomAvailablePortalLayout,
    MashroomAvailablePortalTheme,
    MashroomPortalAdminService,
    MashroomPortalPage,
    MashroomPortalPageRef,
    MashroomPortalSiteService
} from '@mashroom/mashroom-portal/type-definitions';
import type {FormContext, SelectFieldOptions} from '@mashroom/mashroom-portal-ui-commons/type-definitions';
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

// RFC 3986
const VALID_PATH = /^[a-zA-Z0-9.\-_~!$&'()*+,;=:@/]+$/;

export default class PageConfigureDialog extends PureComponent<Props> {

    close: (() => void) | undefined;

    componentDidUpdate(prevProps: Props): void {
        const {selectedPage, dataLoadingService, portalAdminService, setPage, setPageRef, setPermittedRoles, setLoading, setErrorLoading} = this.props;
        if (selectedPage && (!prevProps.selectedPage || selectedPage.selectedTs !== prevProps.selectedPage.selectedTs)) {
            const pageId = selectedPage.pageId;
            const promises = [];

            promises.push(dataLoadingService.loadAvailableLanguages());
            promises.push(dataLoadingService.loadAvailableThemes());
            promises.push(dataLoadingService.loadAvailableLayouts());
            promises.push(dataLoadingService.loadPageTree());

            if (pageId) {
                promises.push(portalAdminService.getPage(pageId).then(
                    (page) => {
                        setPage(page);
                    }
                ));
                promises.push(portalAdminService.getPagePermittedRoles(pageId).then(
                    (roles) => {
                        setPermittedRoles(roles);
                    }
                ));
            }

            promises.push(portalAdminService.getSite(portalAdminService.getCurrentSiteId()).then(
                (site) => {
                    if (pageId) {
                        const pageRef = searchPageRef(pageId, site.pages);
                        if (pageRef) {
                            setPageRef(pageRef);
                        } else {
                            return Promise.reject(`No pageRef found for pageId: ${pageId}`);
                        }
                    }
                }
            ));

            Promise.all(promises).then(
                () => {
                    setLoading(false);
                },
                (error) => {
                    console.error(error);
                    setErrorLoading(true);
                }
            );
        }
    }

    onClose(): void {
        this.close && this.close();
    }

    onCloseRef(close: () => void): void {
        this.close = close;
    }

    onSubmit(values: FormValues): void {
        const {portalSiteService, portalAdminService, setErrorUpdating, pages, selectedPage} = this.props;
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
            clientSideRouting: values.page.clientSideRouting,
            hidden: values.page.hidden,
            subPages: values.page.subPages
        };

        const promise = portalAdminService.getSite(portalAdminService.getCurrentSiteId()).then(
            (site) => {
                const siteClone = {...site, pages: [...site.pages]};

                let parentPageId: string | undefined | null;
                const updatePageRef = () => {
                    insertOrUpdatePageAtPosition(pageRef, siteClone.pages, values.position, parentPageId);
                    return portalAdminService.updateSite(siteClone);
                };

                const updatePagePermittedRoles = (pageId: string) => {
                    return portalAdminService.updatePagePermittedRoles(pageId, values.roles);
                };

                if (pageId) {
                    const parentPage = getParentPage(pageId, pages.pagesFlattened);
                    parentPageId = parentPage ? parentPage.pageId : null;

                    return portalAdminService.updatePage(page).then(
                        () => {
                            return Promise.all([updatePageRef(), updatePagePermittedRoles(pageId)]);
                        }
                    );
                } else {
                    return portalAdminService.addPage(page).then(
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
                if (pageId === portalAdminService.getCurrentPageId() && selectedPage.pageRef && selectedPage.pageRef.friendlyUrl !== pageRef.friendlyUrl) {
                    // Friendly URL changed
                    const url = window.location.href.replace(selectedPage.pageRef.friendlyUrl, pageRef.friendlyUrl);
                    window.location.href = url;
                } else {
                    if (!pageId) {
                        // Goto new page
                        const url = `${portalSiteService.getCurrentSiteUrl()}${pageRef.friendlyUrl}`;
                        window.location.href = url;
                    } else {
                        window.location.reload();
                    }
                }
            },
            (error) => {
                console.error('Updating page failed!', error);
                setErrorUpdating(true);
            }
        );
    }

    getInitialValues(): FormValues | null {
        const {pages, portalAdminService} = this.props;
        const {selectedPage} = this.props;
        if (!selectedPage) {
            return null;
        }

        const pageId = selectedPage.pageId;
        let page = {};
        let position = null;

        if (pageId) {
            page = {...selectedPage.page, ...selectedPage.pageRef};
            position = getPagePosition(pageId, pages.pagesFlattened, pages.pages);
        } else {
            position = {
                parentPageId: null,
                // Default: insert after the current page
                insertAfterPageId: portalAdminService.getCurrentPageId(),
            };
        }

        return {
            page,
            position,
            roles: selectedPage.permittedRoles
        };
    }

    onChange(values: FormValues, previousValues: FormValues, context: FormContext): void {
        const {languages} = this.props;

        // Set friendlyUrl automatically based on the title for a new page
        if (values.page && previousValues.page && context.initialValues.page && !context.initialValues.page.friendlyUrl) {
            const title = typeof (values.page.title) === 'object' ? values.page.title[languages.default] : values.page.title;
            const previousTitle = typeof (previousValues.page.title) === 'object' ? previousValues.page.title[languages.default] : previousValues.page.title;

            if (title && title !== previousTitle) {
                let friendlyUrl = latinize(title.replace(/[ -,;.]/g, '_')).toLowerCase();
                if (friendlyUrl && friendlyUrl.indexOf('/') !== 0) {
                    friendlyUrl = `/${friendlyUrl}`;
                }
                context.setFieldValue('page.friendlyUrl', friendlyUrl);
            }
        }
    }

    validate(values: FormValues): any {
        const {languages, pages, selectedPage} = this.props;

        const errors: any = {
            page: {}
        };
        if (!values.page) {
            return errors;
        }

        const title = typeof (values.page.title) === 'object' ? values.page.title[languages.default] : values.page.title;
        if (!title || title.trim() === '') {
            errors.page.title = 'required';
        }

        const friendlyUrl = values.page.friendlyUrl;
        if (!friendlyUrl || friendlyUrl.trim() === '') {
            errors.page.friendlyUrl = 'required';
        } else if (!friendlyUrl.startsWith('/')) {
            errors.page.friendlyUrl = 'mustStartWithSlash';
        } else if (friendlyUrl !== '/' && friendlyUrl.endsWith('/')) {
            errors.page.friendlyUrl = 'mustNotEndWithSlash';
        } else if (!friendlyUrl.match(VALID_PATH)) {
            errors.page.friendlyUrl = 'invalidCharacters';
        } else {
            const conflictingRoute = pages.pagesFlattened.find((page) => {
               if (selectedPage && page.pageId === selectedPage.pageId) {
                   return false;
               }
               if (values.page.clientSideRouting && (friendlyUrl === '/' || page.friendlyUrl.toLowerCase().startsWith(`${friendlyUrl.toLowerCase()}/`))) {
                   return true;
               }
               if (page.clientSideRouting && friendlyUrl.toLowerCase().startsWith(`${page.friendlyUrl.toLowerCase()}/`)) {
                   return true;
               }
               return page.friendlyUrl.toLowerCase() === friendlyUrl.toLowerCase();
            });
            if (conflictingRoute) {
                errors.page.friendlyUrl = `routeConflict::pageTitle:${conflictingRoute.title}`;
            }
        }

        if (Object.keys(errors.page).length === 0) {
            delete errors.page;
        }

        return errors;
    }

    renderPageGeneral(): ReactNode {
        const {selectedPage, pages} = this.props;
        if (!selectedPage) {
            return null;
        }

        return (
            <DialogContent>
                <FormRow>
                    <FormCell>
                        <I18NStringField id='title' name='page.title' labelId='title'/>
                    </FormCell>
                </FormRow>
                <FormRow>
                    <FormCell>
                        <TextField id='friendlyUrl' name='page.friendlyUrl' labelId='friendlyUrl'/>
                    </FormCell>
                </FormRow>
                <FormRow>
                    <FormCell>
                        <CheckboxField id='clientSideRouting' name='page.clientSideRouting' labelId='clientSideRouting'/>
                    </FormCell>
                </FormRow>
                <FormRow>
                    <FormCell>
                        <CheckboxField id='hidden' name='page.hidden' labelId='hideInNavigation'/>
                    </FormCell>
                </FormRow>
                <PagePositionSelection pageId={selectedPage.pageId} pages={pages.pagesFlattened}/>
            </DialogContent>
        );
    }

    renderPageAppearance(): ReactNode {
        const {availableThemes, availableLayouts} = this.props;

        let availableThemesOptions: SelectFieldOptions = [{
            value: null,
            label: '<Site Default>'
        }];
        availableThemesOptions = availableThemesOptions.concat(availableThemes.map((theme) => ({
            value: theme.name,
            label: theme.name
        })));
        let availableLayoutsOptions: SelectFieldOptions = [{
            value: null,
            label: '<Site Default>'
        }];
        availableLayoutsOptions = availableLayoutsOptions.concat(availableLayouts.map((layout) => ({
            value: layout.name,
            label: layout.name
        })));

        return (
            <DialogContent>
                <FormRow>
                    <FormCell>
                        <SelectField id='theme' name='page.theme' labelId='theme'
                                     options={availableThemesOptions}/>
                    </FormCell>
                </FormRow>
                <FormRow>
                    <FormCell>
                        <SelectField id='layout' name='page.layout' labelId='layout'
                                     options={availableLayoutsOptions}/>
                    </FormCell>
                </FormRow>
                <FormRow>
                    <FormCell>
                        <SourceCodeEditorField id='extraCss' labelId='extraCss' name='page.extraCss' language='css'/>
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
                        <TextField id='keywords' name='page.keywords' labelId='keywords'/>
                    </FormCell>
                </FormRow>
                <FormRow>
                    <FormCell>
                        <TextareaField id='description' name='page.description' labelId='description'
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
            <TabDialog name='page-configure' tabs={[
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
                <Button id='cancel' labelId='cancel' secondary onClick={this.onClose.bind(this)}/>
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
        const {selectedPage} = this.props;
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
            <Modal
                appWrapperClassName='mashroom-portal-admin-app'
                className='page-configure-dialog'
                name={DIALOG_NAME_PAGE_CONFIGURE}
                titleId='configurePage'
                width={500}
                closeRef={this.onCloseRef.bind(this)}>
                {this.renderContent()}
            </Modal>
        );
    }

}
