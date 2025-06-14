
import React, {useCallback} from 'react';
import {nanoid} from 'nanoid';
import {
    Form,
    TextField,
    SourceCodeEditorField,
    Button
} from '@mashroom/mashroom-portal-ui-commons';
import {containsWildcard} from '@mashroom/mashroom-utils/lib/messaging-utils';
import {useDispatch} from 'react-redux';
import {addPublishedMessage, updatePublishedMessageStatus as updatePublishedMessageStatusAction} from '../store/actions';

import type {MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions';
import type {FormContext} from '@mashroom/mashroom-portal-ui-commons/type-definitions';
import type {PublishedMessage, PublishedMessageStatus} from '../types';

type FormData = {
    topic: string;
    message: string;
}

type Props = {
    messageBus: MashroomPortalMessageBus,
}

const initialValues: FormData = {
    topic: '',
    message: `{

}`
};

export default ({messageBus}: Props) => {
    const dispatch = useDispatch();
    const addMessage = (message: PublishedMessage) => dispatch(addPublishedMessage(message));
    const updatePublishedMessageStatus = (messageId: string, status: PublishedMessageStatus, errorMessage?: string) => dispatch(updatePublishedMessageStatusAction(messageId, status, errorMessage));

    const validate = useCallback((values: FormData) => {
        const errors: { [k in keyof FormData]?: string } = {};
        const {topic, message} = values;

        if (!topic || !topic.trim()) {
            errors.topic = 'errorTopicMandatory';
        } else if (containsWildcard(topic)) {
            errors.topic = 'errorTopicWildcards';
        } else if (topic.indexOf('/') === 0 || topic.lastIndexOf('/') === topic.length - 1) {
            errors.topic = 'errorTopicSlash';
        }
        try {
            JSON.parse(message);
        } catch {
            errors.message = 'errorInvalidJSON';
        }

        return errors;
    }, []);

    const onSubmit = useCallback((values: FormData, context: FormContext) => {
        const {topic, message} = values;
        const jsonMessage = JSON.parse(message);
        const remoteTopic = `${messageBus.getRemotePrefix()}${topic}`;
        const id = nanoid(8);

        const publishedMessage: PublishedMessage = {
            id,
            topic: remoteTopic,
            message: jsonMessage,
            timestamp: Date.now(),
            status: 'Pending',
        };
        addMessage(publishedMessage);

        messageBus.publish(remoteTopic, jsonMessage).then(
            () => {
                updatePublishedMessageStatus(id, 'Success');
            },
            (error) => {
                updatePublishedMessageStatus(id, 'Error', JSON.stringify(error));
            }
        );

        context.resetForm();
    }, []);

    return (
        <div className='mashroom-remote-messaging-app-publish-form'>
            <Form formId='mashroom-remote-messaging-app-form' initialValues={initialValues} onSubmit={onSubmit} validator={validate}>
            <div className='mashroom-remote-messaging-app-form-row'>
                    <TextField id='mashroom-remote-messaging-app-topic' type='text' name='topic' labelId='remoteTopic' />
                </div>
                <div className='mashroom-remote-messaging-app-form-row '>
                    <SourceCodeEditorField id='mashroom-remote-messaging-app-message' name="message" labelId='message' language='json' theme='light' height={120} />
                </div>
                <div className='mashroom-remote-messaging-app-form-button-row'>
                    <Button id='mashroom-remote-messaging-app-publish-message' type='submit' labelId='sendMessage'/>
                </div>
            </Form>
        </div>
    );
};

