
// @flow

import React from 'react';
import {connect} from 'react-redux';
import {reset as resetForm} from 'redux-form';
import {addPublishedMessage, updatePublishedMessageStatus} from '../store/actions';
import MessageBusSendForm from '../components/MessageBusSendForm';

import type {ComponentType} from 'react';
import type {
    Dispatch, PublishedMessage, PublishedMessageStatus,
    State
} from '../../../type-definitions';
import type {MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions';

type OwnProps = {
    messageBus: MashroomPortalMessageBus,
}

type DispatchProps = {|
    resetForm: (string) => void,
    addPublishedMessage: (message: PublishedMessage) => void,
    updateMessageStatus: (messageId: string, status: PublishedMessageStatus, errorMessage?: string) => void,
|}

const mapStateToProps = (state: State, ownProps: OwnProps) => {
    return {
    };
};

const mapDispatchToProps = (dispatch: Dispatch, ownProps: OwnProps): DispatchProps => ({
    resetForm: (id: string) => {
        dispatch(resetForm(id));
    },
    addPublishedMessage: (message: PublishedMessage) => {
        dispatch(addPublishedMessage(message));
    },
    updateMessageStatus: (messageId: string, status: PublishedMessageStatus, errorMessage?: string) => {
        dispatch(updatePublishedMessageStatus(messageId, status, errorMessage));
    }
});

export default (connect(mapStateToProps, mapDispatchToProps)(MessageBusSendForm): ComponentType<OwnProps>);
