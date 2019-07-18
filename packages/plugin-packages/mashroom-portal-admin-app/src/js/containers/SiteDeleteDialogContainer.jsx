// @flow

import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {setSelectedSiteUpdatingError} from '../store/actions';
import {DependencyContextConsumer} from '../DependencyContext';
import SiteDeleteDialog from '../components/SiteDeleteDialog';

import type {ComponentType} from 'react';
import type {Dispatch, SelectedSite, Sites, State} from '../../../type-definitions';

type OwnProps = {
}

type StateProps = {
    sites: Sites,
    selectedSite: ?SelectedSite
}

type DispatchProps = {
    setErrorUpdating: (boolean) => void
}

class SiteDeleteDialogContainer extends PureComponent<OwnProps & StateProps & DispatchProps> {

    render() {
        return (
            <DependencyContextConsumer>
                {(deps) => <SiteDeleteDialog portalAdminService={deps.portalAdminService} {...this.props}/>}
            </DependencyContextConsumer>
        );
    }
}

const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => ({
    sites: state.sites,
    selectedSite: state.selectedSite
});

const mapDispatchToProps = (dispatch: Dispatch, ownProps: OwnProps): DispatchProps => ({
    setErrorUpdating: (error) => { dispatch(setSelectedSiteUpdatingError(error)); }
});

export default (connect(mapStateToProps, mapDispatchToProps)(SiteDeleteDialogContainer): ComponentType<OwnProps>);
