import React, {useCallback, useContext, useEffect, useMemo, useRef} from 'react';
import latinize from 'latinize';
import {Button, CircularProgress, DialogButtons, ErrorMessage, Form, Modal, TabDialog,} from '@mashroom/mashroom-portal-ui-commons';
import {DependencyContext} from '../DependencyContext';
import {
    setActiveTab,
    setSelectedSiteData,
    setSelectedSiteLoading,
    setSelectedSiteLoadingError,
    setSelectedSitePermittedRoles,
    setSelectedSiteUpdatingError, setShowModal
} from '../store/actions';
import useStore from '../store/useStore';
import {DIALOG_NAME_SITE_CONFIGURE} from '../constants';
import SiteConfigureDialogGeneralPage from './SiteConfigureDialogGeneralPage';
import SiteConfigureDialogPermissionsPage from './SiteConfigureDialogPermissionsPage';

import type {MashroomPortalSite} from '@mashroom/mashroom-portal/type-definitions';
import type {FormContext} from '@mashroom/mashroom-portal-ui-commons/type-definitions';

const TAB_DIALOG_ID = 'site-configure';

type FormValues = {
    site: Partial<MashroomPortalSite>;
    roles: Array<string> | undefined | null;
}

export default () => {
    const closeRef = useRef<(() => void) | undefined>(undefined);
    const sites = useStore((state) => state.sites);
    const selectedSite = useStore((state) => state.selectedSite);
    const languages = useStore((state) => state.languages);
    const availableThemes = useStore((state) => state.availableThemes);
    const availableLayouts = useStore((state) => state.availableLayouts);
    const showModal = useStore((state) => !!state.modals[DIALOG_NAME_SITE_CONFIGURE]?.show);
    const appWrapperDataAttributes = useStore((state) => state.appWrapperDataAttributes);
    const activeTabName = useStore((state) => state.tabDialogs[TAB_DIALOG_ID]?.active);
    const dispatch = useStore((state) => state.dispatch);
    const {dataLoadingService, portalAdminService, portalSiteService} = useContext(DependencyContext);
    const setLoading = (loading: boolean) => dispatch(setSelectedSiteLoading(loading));
    const setErrorLoading = (error: boolean) => dispatch(setSelectedSiteLoadingError(error));
    const setErrorUpdating = (error: boolean) => dispatch(setSelectedSiteUpdatingError(error));
    const setSite = (site: MashroomPortalSite) => dispatch(setSelectedSiteData(site));
    const setPermittedRoles = (roles: Array<string> | undefined | null) => dispatch(setSelectedSitePermittedRoles(roles));
    const closeModal = () => dispatch(setShowModal(DIALOG_NAME_SITE_CONFIGURE, false));
    const setActiveTabName = (tabName: string) => dispatch(setActiveTab(TAB_DIALOG_ID, tabName));

    useEffect(() => {
        if (selectedSite) {
            const siteId = selectedSite.siteId;
            const promises = [];

            setLoading(true);
            setErrorLoading(false);

            promises.push(dataLoadingService.loadAvailableLanguages());
            promises.push(dataLoadingService.loadAvailableThemes());
            promises.push(dataLoadingService.loadAvailableLayouts());
            promises.push(dataLoadingService.loadSites());

            if (siteId) {
                promises.push(portalAdminService.getSite(siteId).then(
                    (siteData) => {
                        setSite(siteData);
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
                    console.error('Error loading site configuration data:', error);
                    setLoading(false);
                    setErrorLoading(true);
                }
            );
        }
    }, [selectedSite?.siteId, selectedSite?.selectedTs]);


    const handleClose = useCallback(() => {
        closeRef.current?.();
    }, []);

    const handleCloseRef = useCallback((cb: () => void) => {
        closeRef.current = cb;
    }, []);

    const handleSubmit = useCallback(async (values: FormValues) => {
        if (!selectedSite) {
            return;
        }

        const completeSiteData = values.site as MashroomPortalSite;
        const siteId = selectedSite.siteId;

        setErrorUpdating(false);

        try {
            let newSite;
            if (siteId) {
                const siteToUpdate = { ...completeSiteData, siteId };
                await portalAdminService.updateSite(siteToUpdate);
                await portalAdminService.updateSitePermittedRoles(siteId, values.roles);
            } else {
                newSite = await portalAdminService.addSite(completeSiteData);
                await portalAdminService.updateSitePermittedRoles(newSite.siteId, values.roles);
            }

            handleClose();

            if (siteId === portalAdminService.getCurrentSiteId()) {
                if (selectedSite.site && selectedSite.site.path !== values.site.path) {
                    // Path changed
                    window.location.href = window.location.href.replace(selectedSite.site.path, completeSiteData.path);
                } else {
                    window.location.reload();
                }
            } else if (!siteId) {
                // Goto new site
                const pathElements = portalSiteService.getCurrentSiteUrl().split('/');
                pathElements.pop();
                pathElements.push(completeSiteData.path.substring(1));
                window.location.href = pathElements.join('/');
            }
        } catch (error) {
            console.error('Updating site failed!', error);
            setErrorUpdating(true);
        }
    }, [selectedSite]);

    const initialFormValues = useMemo((): FormValues | null => {
        if (!selectedSite) {
            return null;
        }
        // Ensure a default empty object for site if it's a new site
        const siteData = selectedSite.siteId ? selectedSite.site : { title: {}, path: '' };

        return {
            site: siteData || { title: {}, path: '' } as Partial<MashroomPortalSite>,
            roles: selectedSite.permittedRoles
        };
    }, [selectedSite]);

    const handleFormChange = useCallback((values: FormValues, previousValues: FormValues, context: FormContext) => {
        if (values.site && previousValues.site && context.initialValues.site && !context.initialValues.site.path) {
            const title = typeof(values.site.title) === 'object' ? values.site.title[languages.default] : values.site.title;
            const previousTitle: string | undefined | null = typeof(previousValues.site.title) === 'object' ? previousValues.site.title[languages.default] : previousValues.site.title;

            if (title && title !== previousTitle) {
                const safeTitle = latinize(title.replace(/[ -,;.]/g, '_')).toLowerCase();
                const path = `/${safeTitle}`;
                context.setFieldValue('site.path', path);
            }
        }
    }, []);

    const validateForm = useCallback((formValues: FormValues): any => {
        const errors: any = { site: {} };
        if (!formValues.site) return errors;

        const title = typeof(formValues.site.title) === 'object' ? formValues.site.title[languages.default] : formValues.site.title;
        if (!title || title.trim() === '') {
            errors.site.title = 'required';
        }

        const path = formValues.site.path;
        if (!path || path.trim() === '') {
            errors.site.path = 'required';
        } else if (!path.startsWith('/')) {
            errors.site.path = 'mustStartWithSlash';
        } else if (path !== '/' && path.indexOf('/', 1) !== -1) { // allow path to be "/"
            errors.site.path = 'mustContainOnlyOneSlash';
        } else if (sites.sites.find((s) => (selectedSite?.siteId !== s.siteId) && s.path === path)) {
            errors.site.path = 'pathAlreadyExists';
        }

        if (Object.keys(errors.site).length === 0) {
            delete errors.site;
        }
        return Object.keys(errors).length > 0 ? errors : {};
    }, [languages.default, sites, selectedSite]);


    let modalContent: React.ReactNode;
    if (!selectedSite) {
        modalContent = null;
    } else if (selectedSite.loading) {
        modalContent = <CircularProgress/>;
    } else if (selectedSite.errorLoading) {
        modalContent = <div className='error-panel'><ErrorMessage messageId='loadingFailed' /></div>;
    } else if (!initialFormValues) {
        modalContent = <CircularProgress/>;
    } else {
        modalContent = (
            <>
                {selectedSite.errorUpdating && <div className='error-panel'><ErrorMessage messageId='updateFailed' /></div>}
                <Form
                    formId='site-configure'
                    initialValues={initialFormValues}
                    validator={validateForm}
                    onChange={handleFormChange}
                    onSubmit={handleSubmit}
                >
                    <TabDialog activeTabName={activeTabName} setActiveTabName={setActiveTabName} tabs={[
                        {name: 'general', titleId: 'general', content: <SiteConfigureDialogGeneralPage availableLayouts={availableLayouts} availableThemes={availableThemes} />},
                        {name: 'permissions', titleId: 'permissions', content: <SiteConfigureDialogPermissionsPage />},
                    ]}/>
                    <DialogButtons>
                        <Button id='save' type='submit' labelId='save'/>
                        <Button id='cancel' labelId='cancel' secondary onClick={handleClose}/>
                    </DialogButtons>
                </Form>
            </>
        );
    }

    return (
        <Modal
            appWrapperClassName='mashroom-portal-admin-app'
            appWrapperDataAttributes={appWrapperDataAttributes}
            className='site-configure-dialog'
            show={showModal}
            close={closeModal}
            titleId='configureSite'
            width={500}
            closeRef={handleCloseRef}
        >
            {modalContent}
        </Modal>
    );
};
