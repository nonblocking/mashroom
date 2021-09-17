
import {connect} from 'react-redux';
import MessageBusHistory from '../components/MessageBusHistory';

import type {State} from '../types';

const mapStateToProps = (state: State) => {
    return {
        activePortalApp: state.activePortalApp,
        messageBusCom: state.messageBusCom,
    };
};

export default connect(mapStateToProps)(MessageBusHistory);
