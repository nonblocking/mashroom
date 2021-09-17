
import {connect} from 'react-redux';
import MessageBusHistory from '../components/MessageBusHistory';

import type {State} from '../types';

const mapStateToProps = (state: State) => {
    return {
        publishedMessages: state.publishedMessages,
        receivedMessages: state.receivedMessages,
    };
};

export default connect(mapStateToProps)(MessageBusHistory);
