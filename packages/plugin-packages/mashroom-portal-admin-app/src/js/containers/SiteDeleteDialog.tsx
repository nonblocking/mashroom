
import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {setSelectedSiteUpdatingError} from '../store/actions';
import {DependencyContextConsumer} from '../DependencyContext';
import SiteDeleteDialogComp from '../components/SiteDeleteDialog';

import type {Dispatch, SelectedSite, Sites, State} from '../types';

type StateProps = {
    sites: Sites;
    selectedSite: SelectedSite | undefined | null;
}

type DispatchProps = {
    setErrorUpdating: (error: boolean) => void;
}

type Props = StateProps & DispatchProps;

class SiteDeleteDialog extends PureComponent<Props> {

    render() {
        return (
            <DependencyContextConsumer>
                {(deps) => <SiteDeleteDialogComp portalAdminService={deps.portalAdminService} {...this.props}/>}
            </DependencyContextConsumer>
        );
    }
}

const mapStateToProps = (state: State): StateProps => ({
    sites: state.sites,
    selectedSite: state.selectedSite
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
    setErrorUpdating: (error) => { dispatch(setSelectedSiteUpdatingError(error)); }
});

export default connect(mapStateToProps, mapDispatchToProps)(SiteDeleteDialog);
