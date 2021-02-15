
import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import PortalAppConfigureDialog from '../components/PortalAppConfigureDialog';
import {DependencyContextConsumer} from '../DependencyContext';
import {setSelectedPortalAppLoading, setSelectedPortalAppLoadingError, setSelectedPortalAppUpdatingError, setSelectedPortalAppPermittedRoles} from '../store/actions';

import type {Dispatch, SelectedPortalApp, State} from '../types';

type StateProps = {
    selectedPortalApp: SelectedPortalApp | undefined | null;
}

type DispatchProps = {
    setLoading: (loading: boolean) => void;
    setErrorLoading: (error: boolean) => void;
    setErrorUpdating: (error: boolean) => void;
    setPermittedRoles: (roles: Array<string> | undefined | null) => void;
}

type Props = StateProps & DispatchProps;

class PortalAppConfigureDialogContainer extends PureComponent<Props> {

    render() {
        return (
            <DependencyContextConsumer>
                {(deps) => <PortalAppConfigureDialog portalAppManagementService={deps.portalAppManagementService} portalAdminService={deps.portalAdminService} {...this.props}/>}
            </DependencyContextConsumer>
        );
    }
}

const mapStateToProps = (state: State): StateProps => ({
    selectedPortalApp: state.selectedPortalApp,
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
    setLoading: (loading) => { dispatch(setSelectedPortalAppLoading(loading)); },
    setErrorLoading: (error) => { dispatch(setSelectedPortalAppLoadingError(error)); },
    setErrorUpdating: (error) => { dispatch(setSelectedPortalAppUpdatingError(error)); },
    setPermittedRoles: (roles) => { dispatch(setSelectedPortalAppPermittedRoles(roles)); }
});

export default connect(mapStateToProps, mapDispatchToProps)(PortalAppConfigureDialogContainer);
