
import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';
import {
    Modal,
    TabDialog,
    Form,
    FormRow,
    FormCell,
    DialogContent,
    DialogButtons,
    Button,
    SourceCodeEditorField,
    FieldLabel,
    CircularProgress,
    ErrorMessage
} from '@mashroom/mashroom-portal-ui-commons';
import {DIALOG_NAME_PORTAL_APP_CONFIGURE} from '../constants';
import Permissions from './Permissions';

import type {MashroomPortalAdminService} from '@mashroom/mashroom-portal/type-definitions';
import type {PortalAppManagementService, SelectedPortalApp} from '../types';

type Props = {
    selectedPortalApp: SelectedPortalApp | undefined | null;
    portalAppManagementService: PortalAppManagementService;
    portalAdminService: MashroomPortalAdminService;
    setLoading: (loading: boolean) => void;
    setErrorLoading: (error: boolean) => void;
    setErrorUpdating: (error: boolean) => void;
    setPermittedRoles: (roles: Array<string> | undefined | null) => void;
};

type FormValues = {
    roles: Array<string> | undefined | null;
    appConfig: any;
}

export default class PortalAppConfigureDialog extends PureComponent<Props> {

    close: (() => void) | undefined;

    componentDidUpdate(prevProps: Props) {
        const {selectedPortalApp, portalAdminService, setPermittedRoles, setLoading, setErrorLoading} = this.props;
        if (selectedPortalApp && (!prevProps.selectedPortalApp || selectedPortalApp.selectedTs !== prevProps.selectedPortalApp.selectedTs)) {
           portalAdminService.getAppInstancePermittedRoles(selectedPortalApp.portalAppName, selectedPortalApp.instanceId).then(
                (permittedRoles) => {
                    setPermittedRoles(permittedRoles);
                    setLoading(false);
                },
                (error) => {
                    console.error(error);
                    setErrorLoading(true);
                }
            );
        }
    }

    onSubmit(values: FormValues) {
        const {selectedPortalApp, portalAdminService, portalAppManagementService, setErrorUpdating} = this.props;
        if (!selectedPortalApp) {
            return;
        }

        const promises = [];

        const roles: Array<string> | undefined | null = values.roles;
        promises.push(portalAdminService.updateAppInstancePermittedRoles(selectedPortalApp.portalAppName, selectedPortalApp.instanceId, roles));

        const newAppConfig = JSON.parse(values.appConfig);
        if (newAppConfig) {
            promises.push(portalAppManagementService.updateAndReloadApp(
                selectedPortalApp.loadedAppId, selectedPortalApp.portalAppName, selectedPortalApp.instanceId,
                null, null, null, newAppConfig));
        }

        Promise.all(promises).then(
            () => {
                this.close?.();
            },
            (error) => {
                console.error('Saving new app config failed', error);
                setErrorUpdating(true);
            }
        );
    }

    onClose() {
        this.close?.();
    }

    onCloseRef(close: () => void) {
        this.close = close;
    }

    validate(values: FormValues): any {
        const errors: any = {};

        try {
            JSON.parse(values.appConfig);
        } catch (e) {
            errors.appConfig = 'errorInvalidJSON';
        }

        return errors;
    }

    getInitialValues() {
        const {selectedPortalApp, portalAppManagementService} = this.props;
        if (!selectedPortalApp) {
            return null;
        }

        const appConfigObj = portalAppManagementService.getAppConfigForLoadedApp(selectedPortalApp.portalAppName, selectedPortalApp.instanceId) || {};
        const appConfig = appConfigObj ? JSON.stringify(appConfigObj, null, 2) : '';

        return {
            appConfig,
            roles: selectedPortalApp.permittedRoles
        };
    }

    renderPageGeneral() {
        const {selectedPortalApp} = this.props;

        let appConfigEditor;
        if (!selectedPortalApp?.customConfigEditor) {
            appConfigEditor = (
                <SourceCodeEditorField id='appConfig' labelId='appConfig' name='appConfig' language='json' theme='dark' />
            );
        } else {
            appConfigEditor = (
                <FormattedMessage id="hintCustomConfigEditor" />
            );
        }

        return (
            <DialogContent>
                <FormRow>
                    <FormCell>
                        <FieldLabel labelId='portalAppName'/>
                        {selectedPortalApp?.portalAppName || ''}
                    </FormCell>
                </FormRow>
                <FormRow>
                    <FormCell>
                        <FieldLabel labelId='portalAppInstanceId'/>
                        {selectedPortalApp?.instanceId || '<none>'}
                    </FormCell>
                </FormRow>
                <FormRow>
                    <FormCell>
                        {appConfigEditor}
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
            <TabDialog name='portal-app-configure' tabs={[
                {name: 'general', titleId: 'general', content: this.renderPageGeneral()},
                {name: 'permissions', titleId: 'permissions', content: this.renderPagePermissions()},
            ]}/>
        );
    }

    renderActions() {
        return (
            <div className='buttons-panel'>
                <DialogButtons>
                    <Button id='save' type='submit' labelId='save'/>
                    <Button id='cancel' labelId='cancel' secondary onClick={this.onClose.bind(this)}/>
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
        const {selectedPortalApp} = this.props;
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
            <Modal
                appWrapperClassName='mashroom-portal-admin-app'
                className='portal-app-configure-dialog'
                name={DIALOG_NAME_PORTAL_APP_CONFIGURE}
                titleId='configureApp'
                width={550}
                closeRef={this.onCloseRef.bind(this)}>
                {this.renderContent()}
            </Modal>
        );
    }

}
