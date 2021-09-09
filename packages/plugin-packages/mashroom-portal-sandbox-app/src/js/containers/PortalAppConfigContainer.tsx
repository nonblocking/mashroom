
import {connect} from 'react-redux';
import PortalAppConfig from '../components/PortalAppConfig';

import type {State} from '../types';

const mapStateToProps = (state: State) => {
    return {
        hostWidth: state.host.width,
        selectedPortalApp: state.selectedPortalApp
    };
};

export default connect(mapStateToProps)(PortalAppConfig);
