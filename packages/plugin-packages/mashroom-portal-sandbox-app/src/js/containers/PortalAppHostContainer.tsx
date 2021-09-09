
import {connect} from 'react-redux';
import PortalAppHost from '../components/PortalAppHost';
import {setHostWidth} from '../store/actions';

import type {
    Dispatch,
    State
} from '../types';

const mapStateToProps = (state: State) => {
  return {
      width: state.host.width,
      activePortalApp: state.activePortalApp,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
    setHostWidth: (hostWidth: string) => { dispatch(setHostWidth(hostWidth)); }
});

export default connect(mapStateToProps, mapDispatchToProps)(PortalAppHost);
