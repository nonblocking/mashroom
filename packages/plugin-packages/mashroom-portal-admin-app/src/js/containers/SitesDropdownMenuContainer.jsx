// @flow

import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {setShowModal} from '@mashroom/mashroom-portal-ui-commons';
import SitesDropdownMenu from '../components/SitesDropdownMenu';
import {DependencyContextConsumer} from '../DependencyContext';
import {setSelectedSite} from '../store/actions';

import type {ComponentType} from 'react';
import type {Dispatch, Sites, State} from '../../../type-definitions';

type OwnProps = {
}

type StateProps = {
    sites: Sites
}

type DispatchProps = {
    showModal: (name: string) => void,
    initConfigureSite: (siteId: string) => void
}

class SitesDropdownMenuContainer extends PureComponent<OwnProps & StateProps & DispatchProps> {

    render() {
        return (
            <DependencyContextConsumer>
                {(deps) => <SitesDropdownMenu portalAdminService={deps.portalAdminService} dataLoadingService={deps.dataLoadingService} {...this.props}/>}
            </DependencyContextConsumer>
        );
    }
}

const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => ({
    sites: state.sites
});

const mapDispatchToProps = (dispatch: Dispatch, ownProps: OwnProps): DispatchProps => ({
    showModal: (name: string) => { dispatch(setShowModal(name, true)); },
    initConfigureSite: (siteId) => { dispatch(setSelectedSite(siteId)); }
});

export default (connect(mapStateToProps, mapDispatchToProps)(SitesDropdownMenuContainer): ComponentType<OwnProps>);
