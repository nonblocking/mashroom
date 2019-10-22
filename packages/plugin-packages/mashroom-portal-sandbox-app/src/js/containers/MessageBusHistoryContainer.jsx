// @flow

import React from 'react';
import {connect} from 'react-redux';
import MessageBusHistory from '../components/MessageBusHistory';

import type {ComponentType} from 'react';
import type {
    ActivePortalApp,
    Dispatch,
    MessageBusCommunication,
    State
} from '../../../type-definitions';

type OwnProps = {
}

type StateProps = {|
    activePortalApp: ?ActivePortalApp,
    messageBusCom: MessageBusCommunication,
|}

const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => {
    return {
        activePortalApp: state.activePortalApp,
        messageBusCom: state.messageBusCom,
    };
};

export default (connect(mapStateToProps)(MessageBusHistory): ComponentType<OwnProps>);
