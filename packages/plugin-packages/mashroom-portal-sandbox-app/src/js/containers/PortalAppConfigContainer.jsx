// @flow

import React from 'react';
import {connect} from 'react-redux';
import PortalAppConfig from '../components/PortalAppConfig';

import type {ComponentType} from 'react';
import type {
    Dispatch, SelectedPortalApp,
    State
} from '../../../type-definitions';

type OwnProps = {
    onConfigSubmit: (SelectedPortalApp, string) => void,
}

type StateProps = {
    hostWidth: string,
    selectedPortalApp: ?SelectedPortalApp,
}

type DispatchProps = {
}

const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => {
    return {
        hostWidth: state.host.width,
        selectedPortalApp: state.selectedPortalApp
    };
};

const mapDispatchToProps = (dispatch: Dispatch, ownProps: OwnProps): DispatchProps => ({
});

export default (connect(mapStateToProps, mapDispatchToProps)(PortalAppConfig): ComponentType<OwnProps>);
