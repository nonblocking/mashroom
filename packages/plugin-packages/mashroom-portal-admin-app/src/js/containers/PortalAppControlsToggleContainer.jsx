// @flow

import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {DependencyContextConsumer} from '../DependencyContext';
import PortalAppControlsToggle from '../components/PortalAppControlsToggle';
import {setShowPortalAppControls} from '../store/actions';

import type {ComponentType} from 'react';
import type {Dispatch, State} from '../../../type-definitions';

type OwnProps = {
}

type StateProps = {|
    portalAppControls: boolean,
|}

type DispatchProps = {|
    setShowPortalAppControls: (show: boolean) => void,
|}

class PortalAppControlsToggleContainer extends PureComponent<OwnProps & StateProps & DispatchProps> {

    render() {
        return (
            <DependencyContextConsumer>
                {(deps) => <PortalAppControlsToggle portalAppManagementService={deps.portalAppManagementService} {...this.props}/>}
            </DependencyContextConsumer>
        );
    }
}

const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => ({
    portalAppControls: state.portalAppControls,
});

const mapDispatchToProps = (dispatch: Dispatch, ownProps: OwnProps): DispatchProps => ({
    setShowPortalAppControls: (show: boolean) => {
        dispatch(setShowPortalAppControls(show));
    },
});

export default (connect(mapStateToProps, mapDispatchToProps)(PortalAppControlsToggleContainer): ComponentType<OwnProps>);
