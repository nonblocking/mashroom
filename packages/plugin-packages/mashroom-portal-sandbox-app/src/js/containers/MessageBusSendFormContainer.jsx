
// @flow

import React from 'react';
import {connect} from 'react-redux';
import {reset as resetForm} from 'redux-form';
import MessageBusSendForm from '../components/MessageBusSendForm';
import {addSentMessage} from '../store/actions';

import type {ComponentType} from 'react';
import type {
    ActivePortalApp,
    Dispatch,
    MessageBusMessage,
    State
} from '../../../type-definitions';
import type {MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions';

type OwnProps = {
    messageBus: MashroomPortalMessageBus,
}

type StateProps = {
    activePortalApp: ?ActivePortalApp,
    subscribedTopics: Array<string>,
}

type DispatchProps = {
    addSentMessage: (MessageBusMessage) => void,
    resetForm: (string) => void,
}

const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => {
    return {
        activePortalApp: state.activePortalApp,
        subscribedTopics: state.messageBusCom.subscribedTopics,
    };
};

const mapDispatchToProps = (dispatch: Dispatch, ownProps: OwnProps): DispatchProps => ({
    addSentMessage: (message: MessageBusMessage) => { dispatch(addSentMessage(message)); },
    resetForm: (id: string) => { dispatch(resetForm(id)); }
});

export default (connect(mapStateToProps, mapDispatchToProps)(MessageBusSendForm): ComponentType<OwnProps>);
