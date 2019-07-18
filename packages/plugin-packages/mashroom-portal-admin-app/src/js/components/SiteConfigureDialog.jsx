// @flow

import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';
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
    CircularProgress, ErrorMessage
} from '@mashroom/mashroom-portal-ui-commons';
import Permissions from './Permissions';
import I18NStringFieldContainer from '../containers/I18NStringFieldContainer';
import {DIALOG_NAME_SITE_CONFIGURE} from '../constants';

import type {
    MashroomAvailablePortalLayout,
    MashroomAvailablePortalTheme,
    MashroomPortalAdminService,
    MashroomPortalSite, MashroomPortalSiteService
} from '@mashroom/mashroom-portal/type-definitions';
import type {DataLoadingService, Languages, SelectedSite} from '../../../type-definitions';


type Props = {
    selectedSite: ?SelectedSite,
    languages: Languages,
    availableThemes: Array<MashroomAvailablePortalTheme>,
    availableLayouts: Array<MashroomAvailablePortalLayout>,
    dataLoadingService: DataLoadingService,
    portalAdminService: MashroomPortalAdminService,
    portalSiteService: MashroomPortalSiteService,
    setLoading: (boolean) => void,
    setErrorLoading: (boolean) => void,
    setErrorUpdating: (boolean) => void,
    setSite: (MashroomPortalSite) => void,
    setPermittedRoles: (?Array<string>) => void
};

type FormValues = {
    site: $Shape<MashroomPortalSite>,
    roles: ?Array<string>
}

export default class SiteConfigureDialog extends PureComponent<Props> {

    close: () => void;

    componentDidUpdate(prevProps: Props) {
        if (this.props.selectedSite && (!prevProps.selectedSite || this.props.selectedSite.selectedTs !== prevProps.selectedSite.selectedTs)) {
            const siteId = this.props.selectedSite.siteId;
            const promises = [];

            promises.push(this.props.dataLoadingService.loadAvailableLanguages());
            promises.push(this.props.dataLoadingService.loadAvailableThemes());
            promises.push(this.props.dataLoadingService.loadAvailableLayouts());

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

    onClose() {
        this.close && this.close();
    }

    onCloseRef(close: () => void) {
        this.close = close;
    }

    onSubmit(values: FormValues) {
        const selectedSite = this.props.selectedSite;
        if (!selectedSite) {
            return null;
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

    getInitialValues(): ?FormValues {
        const selectedSite = this.props.selectedSite;
        if (!selectedSite) {
            return null;
        }

        return {
            site: selectedSite.site || {},
            roles: selectedSite.permittedRoles
        };
    }

    validate(values: FormValues) {
        const errors = {
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
        }

        if (!values.site.defaultTheme) {
            errors.site.defaultTheme = 'required';
        }
        if (!values.site.defaultLayout) {
            errors.site.defaultLayout = 'required';
        }

        return errors;
    }

    renderPageGeneral() {
        let availableThemesOptions = [{
            value: null,
            label: ''
        }];
        availableThemesOptions = availableThemesOptions.concat(this.props.availableThemes.map((theme) => ({
            value: theme.name,
            label: theme.name
        })));
        let availableLayoutsOptions = [{
            value: null,
            label: ''
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

    renderPagePermissions() {
        return (
            <DialogContent>
                <Permissions />
            </DialogContent>
        );
    }

    renderTabDialog() {
        return (
            <TabDialogContainer name='site-configure' tabs={[
                {name: 'general', titleId: 'general', content: this.renderPageGeneral()},
                {name: 'permissions', titleId: 'permissions', content: this.renderPagePermissions()},
            ]}/>
        );
    }

    renderActions() {
        return (
            <DialogButtons>
                <Button id='cancel' labelId='cancel' onClick={this.onClose.bind(this)}/>
                <Button id='save' type='submit' labelId='save'/>
            </DialogButtons>
        );
    }

    renderLoading() {
        return (
            <CircularProgress/>
        );
    }

    renderLoadingError() {
        return (
            <ErrorMessage>
                <FormattedMessage id='loadingFailed'/>
            </ErrorMessage>
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
        if (selectedSite.loading) {
            return this.renderLoading();
        } else if (selectedSite.errorLoading) {
            return this.renderLoadingError();
        } else if (selectedSite.errorUpdating) {
            return this.renderUpdatingError();
        }

        return (
            <Form formId='site-configure' initialValues={this.getInitialValues()} validator={this.validate.bind(this)} onSubmit={this.onSubmit.bind(this)}>
                {this.renderTabDialog()}
                {this.renderActions()}
            </Form>
        );
    }

    render() {
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
