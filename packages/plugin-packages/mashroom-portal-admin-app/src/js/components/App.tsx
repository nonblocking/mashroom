// Style
import '../../sass/style.scss';

import React, {useEffect, useMemo} from 'react';
import {Provider as ReduxProvider} from 'react-redux';
import store from '../store/store';
import {setUserName, setCurrentLanguage} from '../store/actions';
import MessagesProvider from '../messages/MessagesProvider';
import {DependencyContextProvider} from '../DependencyContext';
import PortalAppManagementServiceImpl from '../services/PortalAppManagementServiceImpl';
import DataLoadingServiceImpl from '../services/DataLoadingServiceImpl';
import AdminMenuBar from './AdminMenuBar';
import Modals from './Modals';

import type {
    MashroomPortalAppService,
    MashroomPortalAdminService,
    MashroomPortalSiteService, MashroomPortalUserService
} from '@mashroom/mashroom-portal/type-definitions';
import type {DependencyContext as DependencyContextType} from '../types';

type Props = {
    lang: string;
    userName: string | undefined | null;
    portalSiteService: MashroomPortalSiteService;
    portalUserService: MashroomPortalUserService;
    portalAppService: MashroomPortalAppService;
    portalAdminService: MashroomPortalAdminService;
}

export default ({
    lang,
    userName,
    portalSiteService,
    portalUserService,
    portalAppService,
    portalAdminService
}: Props) => {
    useEffect(() => {
        store.dispatch(setUserName(userName || 'Administrator'));
        store.dispatch(setCurrentLanguage(lang));
    }, []);

    const dependencyContext: DependencyContextType = useMemo(() => {
        const portalAppManagementService = new PortalAppManagementServiceImpl(store, portalAppService, portalAdminService);
        const dataLoadingService = new DataLoadingServiceImpl(store, portalUserService, portalSiteService, portalAppService, portalAdminService);
        return {
            portalAppManagementService,
            dataLoadingService,
            portalAdminService,
            portalSiteService,
            portalUserService
        };
    }, []);

    return (
        <ReduxProvider store={store}>
            <MessagesProvider lang={lang}>
                <DependencyContextProvider deps={dependencyContext}>
                    <div className='mashroom-portal-admin-app'>
                        <div className='menu-bar'>
                            <AdminMenuBar />
                            <Modals />
                        </div>
                    </div>
                </DependencyContextProvider>
            </MessagesProvider>
        </ReduxProvider>
    );
};

