
import {connect} from 'react-redux';
import {addPublishedMessage, updatePublishedMessageStatus} from '../store/actions';
import MessageBusSendForm from '../components/MessageBusSendForm';

import type {
    Dispatch, PublishedMessage, PublishedMessageStatus,
    State
} from '../types';

const mapStateToProps = (state: State) => {
    return {
    };
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
    addPublishedMessage: (message: PublishedMessage) => {
        dispatch(addPublishedMessage(message));
    },
    updateMessageStatus: (messageId: string, status: PublishedMessageStatus, errorMessage?: string) => {
        dispatch(updatePublishedMessageStatus(messageId, status, errorMessage));
    }
});

export default connect(mapStateToProps, mapDispatchToProps)(MessageBusSendForm);
