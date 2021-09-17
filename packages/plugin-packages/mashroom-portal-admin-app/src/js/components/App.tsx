
// Style
import '../../sass/style.scss';

import React, {PureComponent} from 'react';
import {Provider as ReduxProvider} from 'react-redux';
import {IntlProvider} from 'react-intl';

import store from '../store/store';
import {setUserName, setCurrentLanguage} from '../store/actions';
import messages from '../messages/messages';
import {DependencyContextProvider} from '../DependencyContext';
import PortalAppManagementServiceImpl from '../services/PortalAppManagementServiceImpl';
import DataLoadingServiceImpl from '../services/DataLoadingServiceImpl';

import AdminMenuBar from './AdminMenuBar';
import Modals from './Modals';

import type {ReactNode} from 'react';
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

export default class App extends PureComponent<Props> {

    componentDidMount(): void {
        store.dispatch(setUserName(this.props.userName || 'Administrator'));
        store.dispatch(setCurrentLanguage(this.props.lang));
    }

    getDependencyContext(): DependencyContextType {
        const portalAppManagementService = new PortalAppManagementServiceImpl(store, this.props.portalAppService, this.props.portalAdminService);
        const dataLoadingService = new DataLoadingServiceImpl(store, this.props.portalUserService, this.props.portalSiteService, this.props.portalAppService, this.props.portalAdminService);
        return {
            portalAppManagementService,
            dataLoadingService,
            portalAdminService: this.props.portalAdminService,
            portalSiteService: this.props.portalSiteService,
            portalUserService: this.props.portalUserService
        };
    }

    render(): ReactNode {
        let {lang} = this.props;
        if (!messages[lang]) {
            lang = 'en';
        }

        return (
            <ReduxProvider store={store}>
                <IntlProvider messages={messages[lang]} locale={lang}>
                    <DependencyContextProvider deps={this.getDependencyContext()}>
                        <div className='mashroom-portal-admin-app'>
                            <div className='menu-bar'>
                                <AdminMenuBar/>
                                <Modals/>
                            </div>
                        </div>
                    </DependencyContextProvider>
                </IntlProvider>
            </ReduxProvider>
        );
    }

}
