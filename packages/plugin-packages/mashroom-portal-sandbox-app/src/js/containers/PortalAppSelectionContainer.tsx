
import React from 'react';
import {connect} from 'react-redux';
import PortalAppSelection from '../components/PortalAppSelection';

import type {State} from '../types';


const mapStateToProps = (state: State) => {
    return {
        availablePortalApps: state.availablePortalApps,
        appLoadingError: state.appLoadingError
    };
};

export default connect(mapStateToProps)(PortalAppSelection);
