
import {connect} from 'react-redux';
import {setPrivateUserTopicsSubscription, setGlobalNotificationsSubscription, addReceivedMessage} from '../store/actions';
import SubscriptionPanel from '../components/SubscriptionPanel';

import type {
    Dispatch,
    ReceivedMessage,
    Subscription,
    State,
} from '../types';

const mapStateToProps = (state: State) => {
    return {
        privateUserTopicsSubscription: state.privateUserTopicsSubscription,
        globalNotificationsSubscription: state.globalNotificationsSubscription,
    };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
    setPrivateUserTopicsSubscription: (subscription: Subscription) => { dispatch(setPrivateUserTopicsSubscription(subscription)); },
    setGlobalNotificationsSubscription: (subscription: Subscription) => { dispatch(setGlobalNotificationsSubscription(subscription)); },
    addReceivedMessage: (message: ReceivedMessage) => { dispatch(addReceivedMessage(message)); },
});

export default connect(mapStateToProps, mapDispatchToProps)(SubscriptionPanel);
