
import React from 'react';
import {connect} from 'react-redux';
import AvailableAppsPanel from '../components/AvailableAppsPanel';

import type {State} from '../types';

const mapStateToProps = (state: State) => {
  return {
      availableApps: state.availableApps,
  };
};

export default connect(mapStateToProps)(AvailableAppsPanel);
