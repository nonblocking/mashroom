// @flow

import React from 'react';
import {connect} from 'react-redux';
import PortalApp from '../components/PortalApp';
import {
    setAvailablePortalApps,
    setActivePortalApp,
    setSelectedPortalApp,
    setHostWidth
} from '../store/actions';

import type {ComponentType} from 'react';
import type {
    ActivePortalApp,
    Dispatch,
    DummyMessageBus,
    SelectedPortalApp,
    State
} from '../../../type-definitions';
import type {
    MashroomAvailablePortalApp,
    MashroomPortalAppService,
    MashroomPortalStateService
} from '@mashroom/mashroom-portal/type-definitions';

type OwnProps = {
    portalAppService: MashroomPortalAppService,
    portalStateService: MashroomPortalStateService,
    messageBus: DummyMessageBus,
}

type StateProps = {
    availablePortalApps: Array<MashroomAvailablePortalApp>,
    selectedPortalApp: ?SelectedPortalApp,
    activePortalApp: ?ActivePortalApp,
    hostWidth: string,
}

type DispatchProps = {
    setAvailablePortalApps: (Array<MashroomAvailablePortalApp>) => void,
    setSelectedPortalApp: (?SelectedPortalApp) => void,
    setActivePortalApp: (?ActivePortalApp) => void,
    setHostWidth: (string) => void,
}

const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => {
  return {
      availablePortalApps: state.availablePortalApps,
      selectedPortalApp: state.selectedPortalApp,
      activePortalApp: state.activePortalApp,
      hostWidth: state.host.width,
  };
};

const mapDispatchToProps = (dispatch: Dispatch, ownProps: OwnProps): DispatchProps => ({
    setAvailablePortalApps: (availableApps: Array<MashroomAvailablePortalApp>) => { dispatch(setAvailablePortalApps(availableApps)); },
    setSelectedPortalApp: (app: ?SelectedPortalApp) => { dispatch(setSelectedPortalApp(app)); },
    setActivePortalApp: (app: ?ActivePortalApp) => { dispatch(setActivePortalApp(app)); },
    setHostWidth: (hostWidth: string) => { dispatch(setHostWidth(hostWidth)); }
});

export default (connect(mapStateToProps, mapDispatchToProps)(PortalApp): ComponentType<OwnProps>);
