
import React, {PureComponent} from 'react';
import shortId from 'shortid';
import {
    Form,
    TextFieldContainer,
    TextareaFieldContainer,
    Button
} from '@mashroom/mashroom-portal-ui-commons';
// @ts-ignore
import {containsWildcard} from '@mashroom/mashroom-utils/lib/messaging_utils';

import type {MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions';
import type {PublishedMessage, PublishedMessageStatus} from '../types';

type FormData = {
    topic: string;
    message: string;
}

type Props = {
    messageBus: MashroomPortalMessageBus,
    resetForm: (name: string) => void,
    addPublishedMessage: (message: PublishedMessage) => void,
    updateMessageStatus: (messageId: string, status: PublishedMessageStatus, errorMessage?: string) => void,
}

export default class MessageBusSendForm extends PureComponent<Props> {

    getInitialValues(): FormData {
        return {
            topic: '',
            message: `{

}`
        }
    }

    validate(values: FormData) {
        const errors: { [k in keyof FormData]?: string } = {};
        const { topic, message } = values;

        if (!topic || !topic.trim()) {
            errors.topic = 'errorTopicMandatory';
        } else if (containsWildcard(topic)) {
            errors.topic = 'errorTopicWildcards';
        } else if (topic.indexOf('/') === 0 || topic.lastIndexOf('/') === topic.length - 1) {
            errors.topic = 'errorTopicSlash';
        }
        try {
            JSON.parse(message);
        } catch (e) {
            errors.message = 'errorInvalidJSON';
        }

        return errors;
    }

    onSubmit(values: FormData) {
        const { messageBus, resetForm, addPublishedMessage, updateMessageStatus } = this.props;
        const { topic, message } = values;
        const jsonMessage = JSON.parse(message);
        const remoteTopic = `${messageBus.getRemotePrefix()}${topic}`;
        const id = shortId.generate();

        const publishedMessage: PublishedMessage = {
            id,
            topic: remoteTopic,
            message: jsonMessage,
            timestamp: Date.now(),
            status: 'Pending',
        };
        addPublishedMessage(publishedMessage);

        messageBus.publish(remoteTopic, jsonMessage).then(
            () => {
                updateMessageStatus(id, 'Success');
            },
            (error) => {
                updateMessageStatus(id, 'Error', JSON.stringify(error));
            }
         );

        resetForm('mashroom-demo-remote-messaging-app-form');
    }

    render() {
        return (
            <div className='mashroom-demo-remote-messaging-app-publish-form'>
                <Form formId='mashroom-demo-remote-messaging-app-form' initialValues={this.getInitialValues()} onSubmit={this.onSubmit.bind(this)} validator={this.validate.bind(this)}>
                    <div className='mashroom-demo-remote-messaging-app-form-row'>
                        <TextFieldContainer id='mashroom-demo-remote-messaging-app-topic' type='text' name='topic' labelId='remoteTopic' />
                    </div>
                    <div className='mashroom-demo-remote-messaging-app-form-row '>
                        <TextareaFieldContainer id='mashroom-demo-remote-messaging-app-message' name='message' labelId='message' rows={4} />
                    </div>
                    <div className='mashroom-demo-remote-messaging-app-form-button-row'>
                        <Button id='mashroom-demo-remote-messaging-app-publish-message' type='submit' labelId='publishMessage'/>
                    </div>
                </Form>
            </div>
        );
    }

}
