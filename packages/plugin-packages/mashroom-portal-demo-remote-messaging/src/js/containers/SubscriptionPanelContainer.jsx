// @flow

import React from 'react';
import {connect} from 'react-redux';
import {setSubscription, addReceivedMessage} from '../store/actions';
import SubscriptionPanel from '../components/SubscriptionPanel';

import type {ComponentType} from 'react';
import type {MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions';
import type {
    Dispatch,
    ReceivedMessage,
    Subscription,
    State,
} from '../../../type-definitions';


type OwnProps = {
    messageBus: MashroomPortalMessageBus,
}

type StateProps = {|
    subscription: Subscription,
|}

type DispatchProps = {|
    setSubscription: (subscription: Subscription) => void,
    addReceivedMessage: (message: ReceivedMessage) => void,
|}

const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => {
    return {
        subscription: state.subscription,
    };
};

const mapDispatchToProps = (dispatch: Dispatch, ownProps: OwnProps): DispatchProps => ({
    setSubscription: (subscription: Subscription) => { dispatch(setSubscription(subscription)); },
    addReceivedMessage: (message: ReceivedMessage) => { dispatch(addReceivedMessage(message)); },
});

export default (connect(mapStateToProps, mapDispatchToProps)(SubscriptionPanel): ComponentType<OwnProps>);
