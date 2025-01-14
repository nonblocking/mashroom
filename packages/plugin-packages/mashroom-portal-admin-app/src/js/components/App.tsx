
// Style
import '../../sass/style.scss';

import React, {PureComponent} from 'react';
import {Provider as ReduxProvider} from 'react-redux';
import {IntlProvider} from 'react-intl';

import store from '../store/store';
import {setUserName, setCurrentLanguage} from '../store/actions';
import loadMessages from '../messages';
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

type State = {
    messages: any;
}

export default class App extends PureComponent<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            messages: {}
        };
    }

    componentDidMount() {
        const {userName, lang} = this.props;
        store.dispatch(setUserName(userName || 'Administrator'));
        store.dispatch(setCurrentLanguage(lang));
        loadMessages(lang).then((messages) => this.setState({messages}));
    }

    getDependencyContext(): DependencyContextType {
        const {portalAppService, portalAdminService, portalSiteService, portalUserService} = this.props;
        const portalAppManagementService = new PortalAppManagementServiceImpl(store, portalAppService, portalAdminService);
        const dataLoadingService = new DataLoadingServiceImpl(store, portalUserService, portalSiteService, portalAppService, portalAdminService);
        return {
            portalAppManagementService,
            dataLoadingService,
            portalAdminService,
            portalSiteService,
            portalUserService
        };
    }

    render() {
        const {lang} = this.props;
        const {messages} = this.state;

        if (Object.keys(messages).length === 0) {
            return null;
        }

        return (
            <ReduxProvider store={store}>
                <IntlProvider messages={messages} locale={lang}>
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
