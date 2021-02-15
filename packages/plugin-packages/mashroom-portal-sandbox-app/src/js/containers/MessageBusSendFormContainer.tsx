
import React from 'react';
import {connect} from 'react-redux';
import {reset as resetForm} from 'redux-form';
import MessageBusSendForm from '../components/MessageBusSendForm';
import {addMessagePublishedBySandbox} from '../store/actions';

import type {
    Dispatch,
    MessageBusMessage,
    State
} from '../types';

const mapStateToProps = (state: State) => {
    return {
        activePortalApp: state.activePortalApp,
        topicsSubscribedByApp: state.messageBusCom.topicsSubscribedByApp,
    };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
    addMessagePublishedBySandbox: (message: MessageBusMessage) => { dispatch(addMessagePublishedBySandbox(message)); },
    resetForm: (id: string) => { dispatch(resetForm(id)); }
});

export default connect(mapStateToProps, mapDispatchToProps)(MessageBusSendForm);
