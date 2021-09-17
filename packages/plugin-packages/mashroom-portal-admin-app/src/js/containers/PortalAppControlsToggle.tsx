
import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {DependencyContextConsumer} from '../DependencyContext';
import PortalAppControlsToggleComp from '../components/PortalAppControlsToggle';
import {setShowPortalAppControls} from '../store/actions';

import type {Dispatch, State} from '../types';

type StateProps = {
    portalAppControls: boolean,
}

type DispatchProps = {
    setShowPortalAppControls: (show: boolean) => void;
}

type Props = StateProps & DispatchProps;

class PortalAppControlsToggle extends PureComponent<Props> {

    render() {
        return (
            <DependencyContextConsumer>
                {(deps) => <PortalAppControlsToggleComp portalAppManagementService={deps.portalAppManagementService} {...this.props}/>}
            </DependencyContextConsumer>
        );
    }
}

const mapStateToProps = (state: State): StateProps => ({
    portalAppControls: state.portalAppControls,
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
    setShowPortalAppControls: (show: boolean) => {
        dispatch(setShowPortalAppControls(show));
    },
});

export default connect(mapStateToProps, mapDispatchToProps)(PortalAppControlsToggle);
