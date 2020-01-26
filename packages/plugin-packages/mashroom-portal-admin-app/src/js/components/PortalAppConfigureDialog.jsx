// @flow

import React, {PureComponent} from 'react';
import {
    ModalContainer,
    TabDialogContainer,
    Form,
    FormRow,
    FormCell,
    DialogContent,
    DialogButtons,
    Button,
    SourceCodeEditorFieldContainer,
    FieldLabel,
    CircularProgress,
    ErrorMessage
} from '@mashroom/mashroom-portal-ui-commons';
import Permissions from './Permissions';
import {DIALOG_NAME_PORTAL_APP_CONFIGURE} from '../constants';

import type {MashroomPortalAdminService} from '@mashroom/mashroom-portal/type-definitions';
import type {PortalAppManagementService, SelectedPortalApp} from '../../../type-definitions';

type Props = {
    selectedPortalApp: ?SelectedPortalApp,
    portalAppManagementService: PortalAppManagementService,
    portalAdminService: MashroomPortalAdminService,
    setLoading: (boolean) => void,
    setErrorLoading: (boolean) => void,
    setErrorUpdating: (boolean) => void,
    setPermittedRoles: (?Array<string>) => void
};

export default class PortalAppConfigureDialog extends PureComponent<Props> {

    close: () => void;

    componentDidUpdate(prevProps: Props) {
        if (this.props.selectedPortalApp && (!prevProps.selectedPortalApp || this.props.selectedPortalApp.selectedTs !== prevProps.selectedPortalApp.selectedTs)) {
            this.props.portalAdminService.getAppInstancePermittedRoles(this.props.selectedPortalApp.portalAppName, this.props.selectedPortalApp.instanceId).then(
                (permittedRoles) => {
                    this.props.setPermittedRoles(permittedRoles);
                    this.props.setLoading(false);
                },
                (error) => {
                    console.error(error);
                    this.props.setErrorLoading(true);
                }
            );
        }
    }

    onSubmit(values: any) {
        const selectedPortalApp = this.props.selectedPortalApp;
        if (!selectedPortalApp) {
            return;
        }

        const promises = [];

        const roles: ?Array<string> = values.roles;
        promises.push(this.props.portalAdminService.updateAppInstancePermittedRoles(selectedPortalApp.portalAppName, selectedPortalApp.instanceId, roles));

        const newAppConfig = JSON.parse(values.appConfig);
        if (newAppConfig) {
            promises.push(this.props.portalAppManagementService.updateAndReloadApp(
                selectedPortalApp.loadedAppId, selectedPortalApp.portalAppName, selectedPortalApp.instanceId,
                null, null, null, newAppConfig));
        }

        Promise.all(promises).then(
            () => {
                this.close();
            },
            (error) => {
                console.error('Saving new app config failed', error);
                this.props.setErrorUpdating(true);
            }
        );
    }

    onClose() {
        this.close && this.close();
    }

    onCloseRef(close: () => void) {
        this.close = close;
    }

    validate(values: Object) {
        const errors = {};

        try {
            JSON.parse(values.appConfig);
        } catch (e) {
            errors.appConfig = 'errorInvalidJSON';
        }

        return errors;
    }

    getInitialValues() {
        const selectedPortalApp = this.props.selectedPortalApp;
        if (!selectedPortalApp) {
            return null;
        }

        const appConfigObj = this.props.portalAppManagementService.getAppConfigForLoadedApp(selectedPortalApp.portalAppName, selectedPortalApp.instanceId) || {};
        const appConfig = appConfigObj ? JSON.stringify(appConfigObj, null, 2) : '';

        return {
            appConfig,
            roles: selectedPortalApp.permittedRoles
        };
    }

    renderPageGeneral() {
        return (
            <DialogContent>
                <FormRow>
                    <FormCell>
                        <FieldLabel labelId='portalAppName'/>
                        {this.props.selectedPortalApp && this.props.selectedPortalApp.portalAppName || ''}
                    </FormCell>
                </FormRow>
                <FormRow>
                    <FormCell>
                        <FieldLabel labelId='portalAppInstanceId'/>
                        {this.props.selectedPortalApp && this.props.selectedPortalApp.instanceId || '<none>'}
                    </FormCell>
                </FormRow>
                <FormRow>
                    <FormCell>
                        <SourceCodeEditorFieldContainer labelId='appConfig' name='appConfig' language='json' />
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
            <TabDialogContainer name='portal-app-configure' tabs={[
                {name: 'general', titleId: 'general', content: this.renderPageGeneral()},
                {name: 'permissions', titleId: 'permissions', content: this.renderPagePermissions()},
            ]}/>
        );
    }

    renderActions() {
        return (
            <div className='buttons-panel'>
                <DialogButtons>
                    <Button id='cancel' labelId='cancel' onClick={this.onClose.bind(this)}/>
                    <Button id='save' type='submit' labelId='save'/>
                </DialogButtons>
            </div>
        );
    }

    renderLoading() {
        return (
            <CircularProgress/>
        );
    }

    renderLoadingError() {
        return (
            <div className='error-panel'>
                <ErrorMessage messageId='loadingFailed' />
            </div>
        );
    }

    renderUpdatingError() {
        return (
            <div className='error-panel'>
                <ErrorMessage messageId='updateFailed' />
            </div>
        );
    }

    renderContent() {
        const selectedPortalApp = this.props.selectedPortalApp;
        if (!selectedPortalApp) {
            return null;
        }
        if (selectedPortalApp.loading) {
            return this.renderLoading();
        } else if (selectedPortalApp.errorLoading) {
            return this.renderLoadingError();
        } else if (selectedPortalApp.errorUpdating) {
            return this.renderUpdatingError();
        }

        return (
            <Form formId='portal-app-configure' initialValues={this.getInitialValues()} onSubmit={this.onSubmit.bind(this)} validator={this.validate.bind(this)}>
                {this.renderTabDialog()}
                {this.renderActions()}
            </Form>
        );
    }

    render() {
        return (
            <ModalContainer
                appWrapperClassName='mashroom-portal-admin-app'
                className='portal-app-configure-dialog'
                name={DIALOG_NAME_PORTAL_APP_CONFIGURE}
                titleId='configureApp'
                minWidth={450}
                minHeight={300}
                closeRef={this.onCloseRef.bind(this)}>
                {this.renderContent()}
            </ModalContainer>
        );
    }

}
