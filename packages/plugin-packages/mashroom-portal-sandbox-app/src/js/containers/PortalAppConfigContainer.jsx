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

type StateProps = {|
    hostWidth: string,
    selectedPortalApp: ?SelectedPortalApp,
|}

const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => {
    return {
        hostWidth: state.host.width,
        selectedPortalApp: state.selectedPortalApp
    };
};

export default (connect(mapStateToProps)(PortalAppConfig): ComponentType<OwnProps>);
