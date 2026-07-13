import React, {useCallback, useContext, useEffect, useMemo, useRef} from 'react';
import latinize from 'latinize';
import {
    Button,
    CircularProgress,
    DialogButtons,
    ErrorMessage,
    Form,
    Modal,
    TabDialog,
} from '@mashroom/mashroom-portal-ui-commons';
import {getPagePosition, getParentPage, insertOrUpdatePageAtPosition, searchPageRef} from '../services/model-utils';
import {DependencyContext} from '../DependencyContext';
import {
    setActiveTab,
    setSelectedPageData,
    setSelectedPageLoading,
    setSelectedPageLoadingError,
    setSelectedPagePermittedRoles,
    setSelectedPageRefData,
    setSelectedPageUpdatingError, setShowModal
} from '../store/actions';
import useStore from '../store/useStore';
import {DIALOG_NAME_PAGE_CONFIGURE} from '../constants';
import PageConfigureDialogGeneralPage from './PageConfigureDialogGeneralPage';
import PageConfigureDialogAppearancePage from './PageConfigureDialogAppearancePage';
import PageConfigureDialogSEOPage from './PageConfigureDialogSEOPage';
import PageConfigureDialogPermissionsPage from './PageConfigureDialogPermissionsPage';

import type {PagePosition} from '../types';
import type {FormContext} from '@mashroom/mashroom-portal-ui-commons/type-definitions';
import type {
    MashroomPortalPage,
    MashroomPortalPageRef,
} from '@mashroom/mashroom-portal/type-definitions';

type FormValues = {
    page: Partial<MashroomPortalPage & MashroomPortalPageRef>;
    position: PagePosition;
    roles: Array<string> | undefined | null;
}

// RFC 3986
const VALID_PATH = /^[a-zA-Z0-9.\-_~!$&'()*+,;=:@/]+$/;

const TAB_DIALOG_ID = 'page-configure';

export default () => {
    const closeRef = useRef<(() => void) | undefined>(undefined);
    const languages = useStore((state) => state.languages);
    const pages = useStore((state) => state.pages);
    const availableThemes = useStore((state) => state.availableThemes);
    const availableLayouts = useStore((state) => state.availableLayouts);
    const selectedPage = useStore((state) => state.selectedPage);
    const showModal = useStore((state) => !!state.modals[DIALOG_NAME_PAGE_CONFIGURE]?.show);
    const appWrapperDataAttributes = useStore((state) => state.appWrapperDataAttributes);
    const activeTabName = useStore((state) => state.tabDialogs[TAB_DIALOG_ID]?.active);
    const dispatch = useStore((state) => state.dispatch);
    const {dataLoadingService, portalAdminService, portalSiteService} = useContext(DependencyContext);
    const setLoading = (loading: boolean) => dispatch(setSelectedPageLoading(loading));
    const setErrorLoading = (error: boolean) => dispatch(setSelectedPageLoadingError(error));
    const setErrorUpdating = (error: boolean) => dispatch(setSelectedPageUpdatingError(error));
    const setPage = (page: MashroomPortalPage) => dispatch(setSelectedPageData(page));
    const setPageRef = (pageRef: MashroomPortalPageRef | undefined | null) => dispatch(setSelectedPageRefData(pageRef));
    const setPermittedRoles = (roles: Array<string> | undefined | null) => dispatch(setSelectedPagePermittedRoles(roles));
    const closeModal = () => dispatch(setShowModal(DIALOG_NAME_PAGE_CONFIGURE, false));
    const setActiveTabName = (tabName: string) => dispatch(setActiveTab(TAB_DIALOG_ID, tabName));

    useEffect(() => {
        if (selectedPage) {
            const pageId = selectedPage.pageId;
            const promises = [];

            // These can be initiated without checking pageId
            promises.push(dataLoadingService.loadAvailableLanguages());
            promises.push(dataLoadingService.loadAvailableThemes());
            promises.push(dataLoadingService.loadAvailableLayouts());
            promises.push(dataLoadingService.loadPageTree());

            if (pageId) {
                promises.push(portalAdminService.getPage(pageId).then(
                    (pageData) => {
                        setPage(pageData);
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
                        const foundPageRef = searchPageRef(pageId, site.pages);
                        if (foundPageRef) {
                            setPageRef(foundPageRef);
                        } else {
                            return Promise.reject(new Error(`No pageRef found for pageId: ${pageId}`));
                        }
                    }
                }
            ));

            setLoading(true);
            Promise.all(promises).then(
                () => {
                    setLoading(false);
                    setErrorLoading(false);
                },
                (error) => {
                    console.error('Error loading page configuration data:', error);
                    setLoading(false);
                    setErrorLoading(true);
                }
            );
        }
    }, [selectedPage?.pageId, selectedPage?.selectedTs]);

    const handleClose = useCallback(() => {
        closeRef.current?.();
    }, []);

    const handleCloseRef = useCallback((cb: () => void) => {
        closeRef.current = cb;
    }, []);

    const handleSubmit = useCallback(async (values: FormValues) => {
        if (!selectedPage) {
            return;
        }

        const pageId = selectedPage.pageId;

        const pageData = {
            pageId: pageId || '',
            description: values.page.description,
            keywords: values.page.keywords,
            theme: values.page.theme,
            layout: values.page.layout,
            extraCss: values.page.extraCss,
            portalApps: values.page.portalApps
        };

        let pageRefData = {
            pageId: pageId || '',
            title: values.page.title || '',
            friendlyUrl: values.page.friendlyUrl || '',
            clientSideRouting: !!values.page.clientSideRouting,
            hidden: !!values.page.hidden,
            subPages: values.page.subPages,
        };

        setErrorUpdating(false);

        try {
            const site = await portalAdminService.getSite(portalAdminService.getCurrentSiteId());
            const siteClone = JSON.parse(JSON.stringify(site));

            let parentPageId: string | undefined | null = values.position?.parentPageId;

            const updatePageRefAndSite = async () => {
                insertOrUpdatePageAtPosition(pageRefData, siteClone.pages, values.position, parentPageId);
                return await portalAdminService.updateSite(siteClone);
            };

            const updateRoles = async (effectivePageId: string) => {
                return await portalAdminService.updatePagePermittedRoles(effectivePageId, values.roles);
            };

            if (pageId) {
                // Existing page
                const parentPage = getParentPage(pageId, pages.pagesFlattened);
                parentPageId = parentPage ? parentPage.pageId : null;

                await portalAdminService.updatePage(pageData);
                await Promise.all([updatePageRefAndSite(), updateRoles(pageId)]);
            } else {
                // New page
                const newPage = await portalAdminService.addPage(pageData);
                pageRefData.pageId = newPage.pageId; // Use the ID of the newly created page
                await Promise.all([updatePageRefAndSite(), updateRoles(newPage.pageId)]);
            }

            handleClose();

            // Navigation logic
            if (pageId === portalAdminService.getCurrentPageId() && selectedPage.pageRef && selectedPage.pageRef.friendlyUrl !== pageRefData.friendlyUrl) {
                const currentFriendlyUrl = selectedPage.pageRef.friendlyUrl.startsWith('/') ? selectedPage.pageRef.friendlyUrl : `/${selectedPage.pageRef.friendlyUrl}`;
                const newFriendlyUrl = pageRefData.friendlyUrl.startsWith('/') ? pageRefData.friendlyUrl : `/${pageRefData.friendlyUrl}`;
                window.location.href = window.location.href.replace(currentFriendlyUrl, newFriendlyUrl);
            } else {
                if (!pageId) {
                    // New page created
                    const newFriendlyUrl = pageRefData.friendlyUrl.startsWith('/') ? pageRefData.friendlyUrl : `/${pageRefData.friendlyUrl}`;
                    window.location.href = `${portalSiteService.getCurrentSiteUrl()}${newFriendlyUrl}`;
                } else {
                    // Existing page updated, reload to see changes
                    window.location.reload();
                }
            }
        } catch (error) {
            console.error('Updating page failed!', error);
            setErrorUpdating(true);
        }
    }, [selectedPage, pages]);

    const initialFormValues = useMemo((): FormValues | null => {
        if (!selectedPage) {
            return null;
        }

        const pageId = selectedPage.pageId;
        let pageContent: Partial<MashroomPortalPage & MashroomPortalPageRef>;
        let positionData: PagePosition | null;

        if (pageId) {
            // For existing page, combine data from page and pageRef objects
            pageContent = { ...selectedPage.page, ...selectedPage.pageRef };
            positionData = getPagePosition(pageId, pages.pagesFlattened, pages.pages);
        } else {
            // Defaults for a new page
            const currentPageId = portalAdminService.getCurrentPageId();
            const parentOfCurrent = pages.pagesFlattened.find((p) => p.subPages?.find((sp) => sp.pageId === currentPageId));
            positionData = {
                parentPageId: parentOfCurrent?.pageId || null,
                insertAfterPageId: currentPageId,
            };
            pageContent = {
                clientSideRouting: false,
                hidden: false,
            };
        }

        return {
            page: pageContent,
            position: positionData,
            roles: selectedPage.permittedRoles
        };
    }, [selectedPage?.pageId, selectedPage?.page, selectedPage?.pageRef, pages.pagesFlattened, pages.pages]);

    const handleFormChange = useCallback((values: FormValues, previousValues: FormValues, context: FormContext) => {
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
    }, []);

    const validateForm = useCallback((values: FormValues) => {
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
            const conflictingRoute = pages.pagesFlattened.find((p) => {
                if (selectedPage && p.pageId === selectedPage.pageId) {
                    return false;
                }
                const pFriendlyUrlLower = p.friendlyUrl.toLowerCase();
                const currentFriendlyUrlLower = friendlyUrl.toLowerCase();

                // Exact match
                if (pFriendlyUrlLower === currentFriendlyUrlLower) return true;

                // Check for prefix conflicts if clientSideRouting is enabled
                if (values.page.clientSideRouting) {
                    // If current page is a prefix of an existing page
                    if (pFriendlyUrlLower.startsWith(`${currentFriendlyUrlLower}/`) && currentFriendlyUrlLower !== '/') return true;
                }
                if (p.clientSideRouting) {
                    // If an existing page is a prefix of the current page
                    if (currentFriendlyUrlLower.startsWith(`${pFriendlyUrlLower}/`) && pFriendlyUrlLower !== '/') return true;
                }
                return false;
            });
            if (conflictingRoute) {
                errors.page.friendlyUrl = `routeConflict::pageTitle:${conflictingRoute.title}`;
            }
        }

        if (Object.keys(errors.page).length === 0) {
            delete errors.page;
        }

        return Object.keys(errors).length > 0 ? errors : {};
    }, [selectedPage?.pageId, pages.pagesFlattened]);

    return (
        <Modal
            appWrapperClassName='mashroom-portal-admin-app'
            appWrapperDataAttributes={appWrapperDataAttributes}
            className='page-configure-dialog'
            show={showModal}
            close={closeModal}
            titleId='configurePage'
            width={500}
            closeRef={handleCloseRef}>
            {(selectedPage?.loading || !initialFormValues) && (
                <CircularProgress/>
            )}
            {selectedPage?.errorLoading && (
                <div className='error-panel'><ErrorMessage messageId='loadingFailed'/></div>
            )}
            {selectedPage && !selectedPage.loading && !selectedPage.errorLoading && (
                <>
                    {selectedPage.errorUpdating && (
                        <div className='error-panel'><ErrorMessage messageId='updateFailed'/></div>
                    )}
                    <Form formId='page-configure'
                          initialValues={initialFormValues}
                          validator={validateForm}
                          onChange={handleFormChange}
                          onSubmit={handleSubmit}>
                        <TabDialog activeTabName={activeTabName} setActiveTabName={setActiveTabName} tabs={[
                            {name: 'general', titleId: 'general', content: <PageConfigureDialogGeneralPage selectedPage={selectedPage} pages={pages}/>},
                            {name: 'appearance', titleId: 'appearance', content: <PageConfigureDialogAppearancePage availableThemes={availableThemes} availableLayouts={availableLayouts} />},
                            {name: 'SEO', titleId: 'SEO', content: <PageConfigureDialogSEOPage />},
                            {name: 'permissions', titleId: 'permissions', content: <PageConfigureDialogPermissionsPage />},
                        ]}/>
                        <DialogButtons>
                            <Button id='save' type='submit' labelId='save'/>
                            <Button id='cancel' labelId='cancel' secondary onClick={handleClose}/>
                        </DialogButtons>
                    </Form>
                </>
            )}
        </Modal>
    );
};
