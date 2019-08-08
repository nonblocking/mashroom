// @flow

import React from 'react';
import {connect} from 'react-redux';
import MessageBusHistory from '../components/MessageBusHistory';
import {addReceivedMessage} from '../store/actions';

import type {ComponentType} from 'react';
import type {
    ActivePortalApp,
    Dispatch,
    MessageBusCommunication,
    MessageBusMessage,
    State
} from '../../../type-definitions';

type OwnProps = {
}

type StateProps = {
    activePortalApp: ?ActivePortalApp,
    messageBusCom: MessageBusCommunication,
}

type DispatchProps = {
    addReceivedMessage: (MessageBusMessage) => void
}

const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => {
    return {
        activePortalApp: state.activePortalApp,
        messageBusCom: state.messageBusCom,
    };
};

const mapDispatchToProps = (dispatch: Dispatch, ownProps: OwnProps): DispatchProps => ({
    addReceivedMessage: (message: MessageBusMessage) => { dispatch(addReceivedMessage(message)); }
});

export default (connect(mapStateToProps, mapDispatchToProps)(MessageBusHistory): ComponentType<OwnProps>);
