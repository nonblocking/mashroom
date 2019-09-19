// @flow

import React from 'react';
import {connect} from 'react-redux';
import PortalApp from '../components/PortalApp';
import {
    setAvailablePortalApps,
    setActivePortalApp,
    setSelectedPortalApp,
    setHostWidth,
    setAppLoadingError
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
    activePortalApp: ?ActivePortalApp,
}

type DispatchProps = {
    setAvailablePortalApps: (Array<MashroomAvailablePortalApp>) => void,
    setSelectedPortalApp: (?SelectedPortalApp) => void,
    setActivePortalApp: (?ActivePortalApp) => void,
    setHostWidth: (string) => void,
    setAppLoadingError: (boolean) => void,
}

const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => {
  return {
      activePortalApp: state.activePortalApp,
  };
};

const mapDispatchToProps = (dispatch: Dispatch, ownProps: OwnProps): DispatchProps => ({
    setAvailablePortalApps: (availableApps: Array<MashroomAvailablePortalApp>) => { dispatch(setAvailablePortalApps(availableApps)); },
    setSelectedPortalApp: (app: ?SelectedPortalApp) => { dispatch(setSelectedPortalApp(app)); },
    setActivePortalApp: (app: ?ActivePortalApp) => { dispatch(setActivePortalApp(app)); },
    setHostWidth: (hostWidth: string) => { dispatch(setHostWidth(hostWidth)); },
    setAppLoadingError: (error: boolean) => { dispatch(setAppLoadingError(error)); }
});

export default (connect(mapStateToProps, mapDispatchToProps)(PortalApp): ComponentType<OwnProps>);
