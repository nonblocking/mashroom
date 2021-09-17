
import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {setShowModal} from '@mashroom/mashroom-portal-ui-commons';
import SitesDropdownMenuComp from '../components/SitesDropdownMenu';
import {DependencyContextConsumer} from '../DependencyContext';
import {setSelectedSite} from '../store/actions';

import type {Dispatch, Sites, State} from '../types';

type StateProps = {
    sites: Sites;
}

type DispatchProps = {
    showModal: (name: string) => void;
    initConfigureSite: (siteId: string) => void;
}

type Props = StateProps & DispatchProps;

class SitesDropdownMenu extends PureComponent<Props> {

    render() {
        return (
            <DependencyContextConsumer>
                {(deps) => <SitesDropdownMenuComp portalAdminService={deps.portalAdminService} dataLoadingService={deps.dataLoadingService} {...this.props}/>}
            </DependencyContextConsumer>
        );
    }
}

const mapStateToProps = (state: State): StateProps => ({
    sites: state.sites
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
    showModal: (name: string) => { dispatch(setShowModal(name, true)); },
    initConfigureSite: (siteId) => { dispatch(setSelectedSite(siteId)); }
});

export default connect(mapStateToProps, mapDispatchToProps)(SitesDropdownMenu);
