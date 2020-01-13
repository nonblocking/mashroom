// @flow

import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import PortalAppConfigureDialog from '../components/PortalAppConfigureDialog';
import {DependencyContextConsumer} from '../DependencyContext';
import {setSelectedPortalAppLoading, setSelectedPortalAppLoadingError, setSelectedPortalAppUpdatingError, setSelectedPortalAppPermittedRoles} from '../store/actions';

import type {ComponentType} from 'react';
import type {Dispatch, SelectedPortalApp, State} from '../../../type-definitions';

type OwnProps = {|
|}

type StateProps = {|
    selectedPortalApp: ?SelectedPortalApp,
|}

type DispatchProps = {|
    setLoading: (boolean) => void,
    setErrorLoading: (boolean) => void,
    setErrorUpdating: (boolean) => void,
    setPermittedRoles: (?Array<string>) => void
|}

type Props = OwnProps & StateProps & DispatchProps;

class PortalAppConfigureDialogContainer extends PureComponent<Props> {

    render() {
        return (
            <DependencyContextConsumer>
                {(deps) => <PortalAppConfigureDialog portalAppManagementService={deps.portalAppManagementService} portalAdminService={deps.portalAdminService} {...this.props}/>}
            </DependencyContextConsumer>
        );
    }
}

const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => ({
    selectedPortalApp: state.selectedPortalApp,
});

const mapDispatchToProps = (dispatch: Dispatch, ownProps: OwnProps): DispatchProps => ({
    setLoading: (loading) => { dispatch(setSelectedPortalAppLoading(loading)); },
    setErrorLoading: (error) => { dispatch(setSelectedPortalAppLoadingError(error)); },
    setErrorUpdating: (error) => { dispatch(setSelectedPortalAppUpdatingError(error)); },
    setPermittedRoles: (roles) => { dispatch(setSelectedPortalAppPermittedRoles(roles)); }
});

export default (connect(mapStateToProps, mapDispatchToProps)(PortalAppConfigureDialogContainer): ComponentType<OwnProps>);
