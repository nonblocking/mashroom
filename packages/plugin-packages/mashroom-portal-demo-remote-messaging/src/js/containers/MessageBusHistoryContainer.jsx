// @flow

import React from 'react';
import {connect} from 'react-redux';
import MessageBusHistory from '../components/MessageBusHistory';

import type {ComponentType} from 'react';
import type {
    Dispatch,
    PublishedMessages,
    ReceivedMessages,
    State
} from '../../../type-definitions';

type OwnProps = {
}

type StateProps = {|
    publishedMessages: PublishedMessages,
    receivedMessages: ReceivedMessages,
|}

const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => {
    return {
        publishedMessages: state.publishedMessages,
        receivedMessages: state.receivedMessages,
    };
};

export default (connect(mapStateToProps)(MessageBusHistory): ComponentType<OwnProps>);
