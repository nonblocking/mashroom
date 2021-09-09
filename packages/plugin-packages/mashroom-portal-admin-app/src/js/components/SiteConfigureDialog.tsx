
import React, {PureComponent} from 'react';
import {change} from 'redux-form';
import {
    ModalContainer,
    TabDialogContainer,
    Form,
    FormRow,
    FormCell,
    DialogContent,
    DialogButtons,
    Button,
    SelectFieldContainer,
    TextFieldContainer,
    CircularProgress,
    ErrorMessage
} from '@mashroom/mashroom-portal-ui-commons';
import Permissions from './Permissions';
import I18NStringFieldContainer from '../containers/I18NStringFieldContainer';
import {DIALOG_NAME_SITE_CONFIGURE} from '../constants';

import type {ReactNode} from 'react';
import type {Dispatch} from 'redux';
import type {
    MashroomAvailablePortalLayout,
    MashroomAvailablePortalTheme,
    MashroomPortalAdminService,
    MashroomPortalSite, MashroomPortalSiteService
} from '@mashroom/mashroom-portal/type-definitions';
import type {DataLoadingService, Languages, SelectedSite, Sites} from '../types';
import {SelectFieldOptions} from '@mashroom/mashroom-portal-ui-commons/type-definitions';

type Props = {
    sites: Sites;
    selectedSite: SelectedSite | undefined | null;
    languages: Languages;
    availableThemes: Array<MashroomAvailablePortalTheme>;
    availableLayouts: Array<MashroomAvailablePortalLayout>;
    dataLoadingService: DataLoadingService;
    portalAdminService: MashroomPortalAdminService;
    portalSiteService: MashroomPortalSiteService;
    setLoading: (loading: boolean) => void;
    setErrorLoading: (error: boolean) => void;
    setErrorUpdating: (error: boolean) => void;
    setSite: (site: MashroomPortalSite) => void;
    setPermittedRoles: (roles: Array<string> | undefined | null) => void;
};

type FormValues = {
    site: MashroomPortalSite;
    roles: Array<string> | undefined | null;
}

export default class SiteConfigureDialog extends PureComponent<Props> {

    close: (() => void) | undefined;

    componentDidUpdate(prevProps: Props): void {
        if (this.props.selectedSite && (!prevProps.selectedSite || this.props.selectedSite.selectedTs !== prevProps.selectedSite.selectedTs)) {
            const siteId = this.props.selectedSite.siteId;
            const promises = [];

            promises.push(this.props.dataLoadingService.loadAvailableLanguages());
            promises.push(this.props.dataLoadingService.loadAvailableThemes());
            promises.push(this.props.dataLoadingService.loadAvailableLayouts());
            promises.push(this.props.dataLoadingService.loadSites());

            if (siteId) {
                promises.push(this.props.portalAdminService.getSite(siteId).then(
                    (site) => {
                        this.props.setSite(site);
                    }
                ));
                promises.push(this.props.portalAdminService.getSitePermittedRoles(siteId).then(
                    (roles) => {
                        this.props.setPermittedRoles(roles);
                    }
                ));
            }

            Promise.all(promises).then(
                () => {
                    this.props.setLoading(false);
                },
                (error) => {
                    console.error(error);
                    this.props.setErrorUpdating(true);
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
        const selectedSite = this.props.selectedSite;
        if (!selectedSite) {
            return;
        }

        const siteId = selectedSite.siteId;
        let promise = null;

        if (siteId) {
            promise = this.props.portalAdminService.updateSite(values.site).then(
                () => {
                    return this.props.portalAdminService.updateSitePermittedRoles(siteId, values.roles);
                }
            );
        } else {
            promise = this.props.portalAdminService.addSite(values.site).then(
                (newSite) => {
                    return this.props.portalAdminService.updateSitePermittedRoles(newSite.siteId, values.roles);
                }
            );
        }

        promise.then(
            () => {
                this.onClose();
                if (siteId === this.props.portalAdminService.getCurrentSiteId()) {
                    if (selectedSite.site && selectedSite.site.path !== values.site.path) {
                        // Path changed
                        const url = window.location.href.replace(selectedSite.site.path, values.site.path);
                        window.location.href = url;
                    } else {
                        window.location.reload(true);
                    }
                } else if (!siteId) {
                    // Goto new site
                    const pathElements = this.props.portalSiteService.getCurrentSiteUrl().split('/');
                    pathElements.pop();
                    pathElements.push(values.site.path.substr(1));
                    const url = pathElements.join('/');
                    window.location.href = url;
                }

            },
            (error) => {
                console.error('Updating site failed!', error);
                this.props.setErrorUpdating(true);
            }
        )
    }

    getInitialValues(): FormValues | null {
        const selectedSite = this.props.selectedSite;
        if (!selectedSite) {
            return null;
        }

        return {
            site: selectedSite.site || {} as any,
            roles: selectedSite.permittedRoles
        };
    }

    onChange(values: FormValues, dispatch: Dispatch<any>, props: any, previousValues: FormValues): void {

        // Set path automatically based on the title for a new page
        if (values.site && previousValues.site && props.initialValues.site && !props.initialValues.site.path) {
            const title = typeof(values.site.title) === 'object' ? values.site.title[this.props.languages.default] : values.site.title;
            const previousTitle: string | undefined | null = typeof(previousValues.site.title) === 'object' ? previousValues.site.title[this.props.languages.default] : previousValues.site.title;

            if (title && title !== previousTitle) {
                const path = `/${title.replace(/[ -]/g, '_')}`;
                dispatch(change(props.form, 'site.path', path));
            }
        }
    }

    validate(values: FormValues): any {
        const errors: any = {
            site: {}
        };
        if (!values.site) {
            return errors;
        }

        const title = typeof(values.site.title) === 'object' ? values.site.title[this.props.languages.default] : values.site.title;
        if (!title || title.trim() === '') {
            errors.site.title = 'required';
        }
        if (!values.site.path || values.site.path.trim() === '') {
            errors.site.path = 'required';
        } else if (values.site.path.indexOf('/') !== 0) {
            errors.site.path = 'mustStartWithSlash';
        } else if (values.site.path.indexOf('/', 1) !== -1) {
            errors.site.path = 'mustContainOnlyOneSlash';
        } else if (this.props.sites.sites.find((site) => (!this.props.selectedSite || this.props.selectedSite.siteId !== site.siteId) && site.path === values.site.path)) {
            errors.site.path = 'pathAlreadyExists';
        }

        return errors;
    }

    renderPageGeneral(): ReactNode {
        let availableThemesOptions: SelectFieldOptions = [{
            value: null,
            label: '<Server Default>',
        }];
        availableThemesOptions = availableThemesOptions.concat(this.props.availableThemes.map((theme) => ({
            value: theme.name,
            label: theme.name
        })));
        let availableLayoutsOptions: SelectFieldOptions = [{
            value: null,
            label: '<Server Default>',
        }];
        availableLayoutsOptions = availableLayoutsOptions.concat(this.props.availableLayouts.map((layout) => ({
            value: layout.name,
            label: layout.name
        })));

        return (
            <DialogContent>
                <FormRow>
                    <FormCell>
                        <I18NStringFieldContainer id='title' name='site.title' labelId='title'/>
                    </FormCell>
                </FormRow>
                <FormRow>
                    <FormCell>
                        <TextFieldContainer id='path' name='site.path' labelId='path'/>
                    </FormCell>
                </FormRow>
                <FormRow>
                    <FormCell>
                        <SelectFieldContainer id='defaultTheme' name='site.defaultTheme' labelId='defaultTheme' options={availableThemesOptions}/>
                    </FormCell>
                </FormRow>
                <FormRow>
                    <FormCell>
                        <SelectFieldContainer id='defaultLayout' name='site.defaultLayout' labelId='defaultLayout' options={availableLayoutsOptions}/>
                    </FormCell>
                </FormRow>
            </DialogContent>
        );
    }

    renderPagePermissions(): ReactNode {
        return (
            <DialogContent>
                <Permissions />
            </DialogContent>
        );
    }

    renderTabDialog(): ReactNode {
        return (
            <TabDialogContainer name='site-configure' tabs={[
                {name: 'general', titleId: 'general', content: this.renderPageGeneral()},
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
                <ErrorMessage messageId='loadingFailed' />
            </div>
        );
    }

    renderUpdatingError(): ReactNode {
        return (
            <div className='error-panel'>
                <ErrorMessage messageId='updateFailed' />
            </div>
        );
    }

    renderContent(): ReactNode {
        const selectedSite = this.props.selectedSite;
        if (!selectedSite) {
            return null;
        }
        if (selectedSite.loading) {
            return this.renderLoading();
        } else if (selectedSite.errorLoading) {
            return this.renderLoadingError();
        } else if (selectedSite.errorUpdating) {
            return this.renderUpdatingError();
        }

        return (
            <Form formId='site-configure'
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
                className='site-configure-dialog'
                name={DIALOG_NAME_SITE_CONFIGURE}
                titleId='configureSite'
                minWidth={500}
                minHeight={300}
                closeRef={this.onCloseRef.bind(this)}>
                {this.renderContent()}
            </ModalContainer>
        );
    }

}
