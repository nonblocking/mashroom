
import {connect} from 'react-redux';
import PortalAppStats from '../components/PortalAppStats';

import type {State} from '../types';

const mapStateToProps = (state: State) => {
  return {
      activePortalApp: state.activePortalApp,
  };
};

export default connect(mapStateToProps)(PortalAppStats);
