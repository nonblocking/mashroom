
// @flow

import React from 'react';
import {connect} from 'react-redux';
import {reset as resetForm} from 'redux-form';
import MessageBusSendForm from '../components/MessageBusSendForm';
import {addMessagePublishedBySandbox} from '../store/actions';

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
    topicsSubscribedByApp: Array<string>,
}

type DispatchProps = {
    addMessagePublishedBySandbox: (MessageBusMessage) => void,
    resetForm: (string) => void,
}

const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => {
    return {
        activePortalApp: state.activePortalApp,
        topicsSubscribedByApp: state.messageBusCom.topicsSubscribedByApp,
    };
};

const mapDispatchToProps = (dispatch: Dispatch, ownProps: OwnProps): DispatchProps => ({
    addMessagePublishedBySandbox: (message: MessageBusMessage) => { dispatch(addMessagePublishedBySandbox(message)); },
    resetForm: (id: string) => { dispatch(resetForm(id)); }
});

export default (connect(mapStateToProps, mapDispatchToProps)(MessageBusSendForm): ComponentType<OwnProps>);
