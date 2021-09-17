
import {connect} from 'react-redux';
import {setSubscription, addReceivedMessage} from '../store/actions';
import SubscriptionPanel from '../components/SubscriptionPanel';

import type {
    Dispatch,
    ReceivedMessage,
    Subscription,
    State,
} from '../types';

const mapStateToProps = (state: State) => {
    return {
        subscription: state.subscription,
    };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
    setSubscription: (subscription: Subscription) => { dispatch(setSubscription(subscription)); },
    addReceivedMessage: (message: ReceivedMessage) => { dispatch(addReceivedMessage(message)); },
});

export default connect(mapStateToProps, mapDispatchToProps)(SubscriptionPanel);
