import React, {useEffect, useRef, useCallback, useMemo, useContext} from 'react';
import {
    Modal,
    TabDialog,
    Form,
    DialogButtons,
    Button,
    CircularProgress,
    ErrorMessage
} from '@mashroom/mashroom-portal-ui-commons';
import {useDispatch, useSelector} from 'react-redux';
import { DIALOG_NAME_PORTAL_APP_CONFIGURE } from '../constants';
import {DependencyContext} from '../DependencyContext';
import {
    setSelectedPortalAppLoading,
    setSelectedPortalAppLoadingError,
    setSelectedPortalAppPermittedRoles,
    setSelectedPortalAppUpdatingError
} from '../store/actions';
import PortalAppConfigureDialogGeneralPage from './PortalAppConfigureDialogGeneralPage';
import PortalAppConfigureDialogPermissionsPage from './PortalAppConfigureDialogPermissionsPage';

import type {State} from '../types';

type FormValues = {
    roles: Array<string> | undefined | null;
    appConfig: any;
}

export default () => {
    const closeRef = useRef<(() => void) | undefined>(undefined);
    const {selectedPortalApp} = useSelector((state: State) => state);
    const {portalAdminService, portalAppManagementService} = useContext(DependencyContext);
    const dispatch = useDispatch();
    const setLoading = (loading: boolean) => dispatch(setSelectedPortalAppLoading(loading));
    const setErrorLoading = (error: boolean) => dispatch(setSelectedPortalAppLoadingError(error));
    const setErrorUpdating = (error: boolean) => dispatch(setSelectedPortalAppUpdatingError(error));
    const setPermittedRoles = (roles: Array<string> | undefined | null) => dispatch(setSelectedPortalAppPermittedRoles(roles));

    useEffect(() => {
        const fetchPermittedRoles = async () => {
            if (selectedPortalApp && selectedPortalApp.portalAppName && selectedPortalApp.instanceId) {
                setLoading(true); // Indicate loading starts
                setErrorLoading(false); // Reset error state

                try {
                    const permittedRoles = await portalAdminService.getAppInstancePermittedRoles(
                        selectedPortalApp.portalAppName,
                        selectedPortalApp.instanceId
                    );
                    setPermittedRoles(permittedRoles);
                } catch (error) {
                    console.error('Error fetching app instance permitted roles:', error);
                    setErrorLoading(true);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchPermittedRoles();
    }, [selectedPortalApp?.portalAppName, selectedPortalApp?.instanceId, selectedPortalApp?.selectedTs]);

    const handleClose = useCallback(() => {
        closeRef.current?.();
    }, []);

    const handleCloseRef = useCallback((cb: () => void) => {
        closeRef.current = cb;
    }, []);

    const handleSubmit = useCallback(async (values: FormValues) => {
        if (!selectedPortalApp || !selectedPortalApp.portalAppName || !selectedPortalApp.instanceId || !selectedPortalApp.loadedAppId) {
            console.error('Selected portal app data is incomplete for submission.');
            setErrorUpdating(true);
            return;
        }

        setErrorUpdating(false);

        const promises = [];
        const roles: Array<string> | undefined | null = values.roles;
        promises.push(portalAdminService.updateAppInstancePermittedRoles(selectedPortalApp.portalAppName, selectedPortalApp.instanceId, roles));

        try {
            const newAppConfig = JSON.parse(values.appConfig);
            if (!selectedPortalApp.customConfigEditor) {
                // Only update if not using a custom editor, where appConfig would be a stringified JSON
                promises.push(portalAppManagementService.updateAndReloadApp(
                    selectedPortalApp.loadedAppId, selectedPortalApp.portalAppName, selectedPortalApp.instanceId,
                    null, null, null, newAppConfig
                ));
            }
        } catch (e) {
            console.error('App config is not valid JSON, not updating app config:', e);
        }

        try {
            await Promise.all(promises);
            handleClose();
        } catch (error) {
            console.error('Saving new app config or roles failed', error);
            setErrorUpdating(true);
        }
    }, [selectedPortalApp?.portalAppName, selectedPortalApp?.instanceId, selectedPortalApp?.loadedAppId]);

    const validateForm = useCallback((values: FormValues): any => {
        const errors: any = {};
        if (selectedPortalApp && !selectedPortalApp.customConfigEditor) {
            try {
                JSON.parse(values.appConfig);
            } catch {
                errors.appConfig = 'errorInvalidJSON';
            }
        }
        return Object.keys(errors).length > 0 ? errors : {}; // Return empty object if no errors
    }, [selectedPortalApp?.portalAppName, selectedPortalApp?.instanceId]);

    const initialFormValues = useMemo((): FormValues | null => {
        if (!selectedPortalApp || !selectedPortalApp.portalAppName) {
            return null;
        }

        let appConfig = '';
        if (!selectedPortalApp.customConfigEditor) {
            const appConfigObj = portalAppManagementService.getAppConfigForLoadedApp(selectedPortalApp.portalAppName, selectedPortalApp.instanceId) || {};
            appConfig = JSON.stringify(appConfigObj, null, 2);
        }

        return {
            appConfig,
            roles: selectedPortalApp.permittedRoles
        };
    }, [selectedPortalApp?.portalAppName, selectedPortalApp?.instanceId, selectedPortalApp?.permittedRoles]);

    return (
        <Modal
            appWrapperClassName='mashroom-portal-admin-app'
            className='portal-app-configure-dialog'
            name={DIALOG_NAME_PORTAL_APP_CONFIGURE}
            titleId='configureApp'
            width={550}
            closeRef={handleCloseRef}
        >
            {selectedPortalApp?.loading || !initialFormValues && (
                <CircularProgress/>
            )}
            {selectedPortalApp?.errorLoading && (
                <div className='error-panel'><ErrorMessage messageId='loadingFailed' /></div>
            )}
            {selectedPortalApp && initialFormValues && (
                <>
                    {selectedPortalApp.errorUpdating && (
                        <div className='error-panel'><ErrorMessage messageId='updateFailed' /></div>
                    )}
                    <Form
                        formId='portal-app-configure'
                        initialValues={initialFormValues}
                        onSubmit={handleSubmit}
                        validator={validateForm}
                    >
                        <TabDialog name='portal-app-configure' tabs={[
                            {name: 'general', titleId: 'general', content: <PortalAppConfigureDialogGeneralPage selectedPortalApp={selectedPortalApp} />},
                            {name: 'permissions', titleId: 'permissions', content: <PortalAppConfigureDialogPermissionsPage />},
                        ]}/>
                        <div className='buttons-panel'>
                            <DialogButtons>
                                <Button id='save' type='submit' labelId='save'/>
                                <Button id='cancel' labelId='cancel' secondary onClick={handleClose}/>
                            </DialogButtons>
                        </div>
                    </Form>
                </>
            )}
        </Modal>
    );
};
