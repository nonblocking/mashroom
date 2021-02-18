
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

import type {MashroomAvailablePortalApp} from '@mashroom/mashroom-portal/type-definitions';
import type {
    ActivePortalApp,
    Dispatch,
    SelectedPortalApp,
    State
} from '../types';

const mapStateToProps = (state: State) => {
  return {
      activePortalApp: state.activePortalApp,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
    setAvailablePortalApps: (availableApps: Array<MashroomAvailablePortalApp>) => dispatch(setAvailablePortalApps(availableApps)),
    setSelectedPortalApp: (app: SelectedPortalApp | undefined | null) => dispatch(setSelectedPortalApp(app)),
    setActivePortalApp: (app: ActivePortalApp | undefined | null) => dispatch(setActivePortalApp(app)),
    setHostWidth: (hostWidth: string) => dispatch(setHostWidth(hostWidth)),
    setAppLoadingError: (error: boolean) => dispatch(setAppLoadingError(error))
});

export default connect(mapStateToProps, mapDispatchToProps)(PortalApp);
