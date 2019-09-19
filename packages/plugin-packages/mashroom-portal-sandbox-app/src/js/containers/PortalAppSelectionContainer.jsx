// @flow

import React from 'react';
import {connect} from 'react-redux';
import PortalAppSelection from '../components/PortalAppSelection';

import type {ComponentType} from 'react';
import type {
    Dispatch,
    State
} from '../../../type-definitions';
import type {MashroomAvailablePortalApp} from '@mashroom/mashroom-portal/type-definitions';

type OwnProps = {
    onSelectionChanged: (?string) => void,
}

type StateProps = {
    availablePortalApps: Array<MashroomAvailablePortalApp>,
    appLoadingError: boolean,
}

type DispatchProps = {
}

const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => {
    return {
        availablePortalApps: state.availablePortalApps,
        appLoadingError: state.appLoadingError
    };
};

const mapDispatchToProps = (dispatch: Dispatch, ownProps: OwnProps): DispatchProps => ({
});

export default (connect(mapStateToProps, mapDispatchToProps)(PortalAppSelection): ComponentType<OwnProps>);
