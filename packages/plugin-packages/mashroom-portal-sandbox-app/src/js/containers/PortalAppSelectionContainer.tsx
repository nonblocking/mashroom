
import {connect} from 'react-redux';
import PortalAppSelection from '../components/PortalAppSelection';

import type {State} from '../types';

const mapStateToProps = (state: State) => {
    return {
        knownPortalApps: state.knownPortalApps,
        appLoadingError: state.appLoadingError
    };
};

export default connect(mapStateToProps)(PortalAppSelection);
