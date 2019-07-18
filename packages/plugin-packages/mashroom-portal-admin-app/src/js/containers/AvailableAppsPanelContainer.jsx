// @flow

import React from 'react';
import {connect} from 'react-redux';
import AvailableAppsPanel from '../components/AvailableAppsPanel';

import type {ComponentType} from 'react';
import type {AvailableApps, Dispatch, State} from '../../../type-definitions';

type OwnProps = {
    onDragStart: ?(event: DragEvent, name: string) => void,
    onDragEnd: ?() => void,
}

type StateProps = {
    availableApps: AvailableApps,
}

type DispatchProps = {
}
const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => {
  return {
      availableApps: state.availableApps,
  };
};

const mapDispatchToProps = (dispatch: Dispatch, ownProps: OwnProps): DispatchProps => ({
});

export default (connect(mapStateToProps, mapDispatchToProps)(AvailableAppsPanel): ComponentType<OwnProps>);
