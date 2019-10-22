// @flow

import React from 'react';
import {connect} from 'react-redux';
import PortalAppHost from '../components/PortalAppHost';
import {setHostWidth} from '../store/actions';

import type {ComponentType} from 'react';
import type {
    ActivePortalApp,
    Dispatch,
    State
} from '../../../type-definitions';

type OwnProps = {
}

type StateProps = {|
    width: string,
    activePortalApp: ?ActivePortalApp,
|}

type DispatchProps = {|
    setHostWidth: (string) => void,
|}

const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => {
  return {
      width: state.host.width,
      activePortalApp: state.activePortalApp,
  };
};

const mapDispatchToProps = (dispatch: Dispatch, ownProps: OwnProps): DispatchProps => ({
    setHostWidth: (hostWidth: string) => { dispatch(setHostWidth(hostWidth)); }
});

export default (connect(mapStateToProps, mapDispatchToProps)(PortalAppHost): ComponentType<OwnProps>);
