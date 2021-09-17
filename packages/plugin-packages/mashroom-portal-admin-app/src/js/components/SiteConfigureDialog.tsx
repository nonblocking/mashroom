
import React, {PureComponent} from 'react';
import latinize from 'latinize';
import {
    Modal,
    TabDialog,
    Form,
    FormRow,
    FormCell,
    DialogContent,
    DialogButtons,
    Button,
    SelectField,
    TextField,
    CircularProgress,
    ErrorMessage
} from '@mashroom/mashroom-portal-ui-commons';
import Permissions from './Permissions';
import I18NStringField from '../containers/I18NStringField';
import {DIALOG_NAME_SITE_CONFIGURE} from '../constants';

import type {ReactNode} from 'react';
import type {
    MashroomAvailablePortalLayout,
    MashroomAvailablePortalTheme,
    MashroomPortalAdminService,
    MashroomPortalSite, MashroomPortalSiteService
} from '@mashroom/mashroom-portal/type-definitions';
import type {DataLoadingService, Languages, SelectedSite, Sites} from '../types';
import type {SelectFieldOptions, FormContext} from '@mashroom/mashroom-portal-ui-commons/type-definitions';

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
        const {selectedSite, dataLoadingService, setSite, portalAdminService, setPermittedRoles,setLoading, setErrorUpdating} = this.props;
        if (selectedSite && (!prevProps.selectedSite || selectedSite.selectedTs !== prevProps.selectedSite.selectedTs)) {
            const siteId = selectedSite.siteId;
            const promises = [];

            promises.push(dataLoadingService.loadAvailableLanguages());
            promises.push(dataLoadingService.loadAvailableThemes());
            promises.push(dataLoadingService.loadAvailableLayouts());
            promises.push(dataLoadingService.loadSites());

            if (siteId) {
                promises.push(portalAdminService.getSite(siteId).then(
                    (site) => {
                        setSite(site);
                    }
                ));
                promises.push(portalAdminService.getSitePermittedRoles(siteId).then(
                    (roles) => {
                        setPermittedRoles(roles);
                    }
                ));
            }

            Promise.all(promises).then(
                () => {
                    setLoading(false);
                },
                (error) => {
                    console.error(error);
                    setErrorUpdating(true);
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
        const {selectedSite, portalAdminService, portalSiteService, setErrorUpdating} = this.props;
        if (!selectedSite) {
            return;
        }

        const siteId = selectedSite.siteId;
        let promise;

        if (siteId) {
            promise = portalAdminService.updateSite(values.site).then(
                () => {
                    return portalAdminService.updateSitePermittedRoles(siteId, values.roles);
                }
            );
        } else {
            promise = portalAdminService.addSite(values.site).then(
                (newSite) => {
                    return portalAdminService.updateSitePermittedRoles(newSite.siteId, values.roles);
                }
            );
        }

        promise.then(
            () => {
                this.onClose();
                if (siteId === portalAdminService.getCurrentSiteId()) {
                    if (selectedSite.site && selectedSite.site.path !== values.site.path) {
                        // Path changed
                        const url = window.location.href.replace(selectedSite.site.path, values.site.path);
                        window.location.href = url;
                    } else {
                        window.location.reload(true);
                    }
                } else if (!siteId) {
                    // Goto new site
                    const pathElements = portalSiteService.getCurrentSiteUrl().split('/');
                    pathElements.pop();
                    pathElements.push(values.site.path.substr(1));
                    const url = pathElements.join('/');
                    window.location.href = url;
                }

            },
            (error) => {
                console.error('Updating site failed!', error);
                setErrorUpdating(true);
            }
        )
    }

    getInitialValues(): FormValues | null {
        const {selectedSite} = this.props;
        if (!selectedSite) {
            return null;
        }

        return {
            site: selectedSite.site || {} as any,
            roles: selectedSite.permittedRoles
        };
    }

    onChange(values: FormValues, previousValues: FormValues, context: FormContext): void {
        const {languages} = this.props;

        // Set path automatically based on the title for a new page
        if (values.site && previousValues.site && context.initialValues.site && !context.initialValues.site.path) {
            const title = typeof(values.site.title) === 'object' ? values.site.title[languages.default] : values.site.title;
            const previousTitle: string | undefined | null = typeof(previousValues.site.title) === 'object' ? previousValues.site.title[languages.default] : previousValues.site.title;

            if (title && title !== previousTitle) {
                const safeTitle = latinize(title.replace(/[ -,;.]/g, '_')).toLowerCase();
                const path = `/${safeTitle}`;
                context.setFieldValue('site.path', path);
            }
        }
    }

    validate(values: FormValues): any {
        const {languages, sites, selectedSite} = this.props;

        const errors: any = {
            site: {}
        };
        if (!values.site) {
            return errors;
        }

        const title = typeof(values.site.title) === 'object' ? values.site.title[languages.default] : values.site.title;
        if (!title || title.trim() === '') {
            errors.site.title = 'required';
        }
        if (!values.site.path || values.site.path.trim() === '') {
            errors.site.path = 'required';
        } else if (values.site.path.indexOf('/') !== 0) {
            errors.site.path = 'mustStartWithSlash';
        } else if (values.site.path.indexOf('/', 1) !== -1) {
            errors.site.path = 'mustContainOnlyOneSlash';
        } else if (sites.sites.find((site) => (!selectedSite || selectedSite.siteId !== site.siteId) && site.path === values.site.path)) {
            errors.site.path = 'pathAlreadyExists';
        }

        if (Object.keys(errors.site).length === 0) {
            delete errors.site;
        }

        return errors;
    }

    renderPageGeneral(): ReactNode {
        const {availableThemes, availableLayouts} = this.props;

        let availableThemesOptions: SelectFieldOptions = [{
            value: null,
            label: '<Server Default>',
        }];
        availableThemesOptions = availableThemesOptions.concat(availableThemes.map((theme) => ({
            value: theme.name,
            label: theme.name
        })));
        let availableLayoutsOptions: SelectFieldOptions = [{
            value: null,
            label: '<Server Default>',
        }];
        availableLayoutsOptions = availableLayoutsOptions.concat(availableLayouts.map((layout) => ({
            value: layout.name,
            label: layout.name
        })));

        return (
            <DialogContent>
                <FormRow>
                    <FormCell>
                        <I18NStringField id='title' name='site.title' labelId='title'/>
                    </FormCell>
                </FormRow>
                <FormRow>
                    <FormCell>
                        <TextField id='path' name='site.path' labelId='path'/>
                    </FormCell>
                </FormRow>
                <FormRow>
                    <FormCell>
                        <SelectField id='defaultTheme' name='site.defaultTheme' labelId='defaultTheme' options={availableThemesOptions}/>
                    </FormCell>
                </FormRow>
                <FormRow>
                    <FormCell>
                        <SelectField id='defaultLayout' name='site.defaultLayout' labelId='defaultLayout' options={availableLayoutsOptions}/>
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
            <TabDialog name='site-configure' tabs={[
                {name: 'general', titleId: 'general', content: this.renderPageGeneral()},
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
        const {selectedSite} = this.props;
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
            <Modal
                appWrapperClassName='mashroom-portal-admin-app'
                className='site-configure-dialog'
                name={DIALOG_NAME_SITE_CONFIGURE}
                titleId='configureSite'
                minWidth={500}
                minHeight={300}
                closeRef={this.onCloseRef.bind(this)}>
                {this.renderContent()}
            </Modal>
        );
    }

}
