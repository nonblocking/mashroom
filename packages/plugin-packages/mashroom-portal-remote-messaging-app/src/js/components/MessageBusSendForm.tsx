
import React, {PureComponent} from 'react';
import {nanoid} from 'nanoid';
import {
    Form,
    TextField,
    SourceCodeEditorField,
    Button
} from '@mashroom/mashroom-portal-ui-commons';
import {containsWildcard} from '@mashroom/mashroom-utils/lib/messaging-utils';

import type {ReactNode} from 'react';
import type {MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions';
import type {FormContext} from '@mashroom/mashroom-portal-ui-commons/type-definitions';
import type {PublishedMessage, PublishedMessageStatus} from '../types';

type FormData = {
    topic: string;
    message: string;
}

type Props = {
    messageBus: MashroomPortalMessageBus,
    addPublishedMessage: (message: PublishedMessage) => void,
    updateMessageStatus: (messageId: string, status: PublishedMessageStatus, errorMessage?: string) => void,
}

export default class MessageBusSendForm extends PureComponent<Props> {

    getInitialValues(): FormData {
        return {
            topic: '',
            message: `{

}`
        };
    }

    validate(values: FormData): any {
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

    onSubmit(values: FormData, context: FormContext): void {
        const { messageBus, addPublishedMessage, updateMessageStatus } = this.props;
        const { topic, message } = values;
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
        addPublishedMessage(publishedMessage);

        messageBus.publish(remoteTopic, jsonMessage).then(
            () => {
                updateMessageStatus(id, 'Success');
            },
            (error) => {
                updateMessageStatus(id, 'Error', JSON.stringify(error));
            }
         );

        context.resetForm();
    }

    render(): ReactNode {
        return (
            <div className='mashroom-remote-messaging-app-publish-form'>
                <Form formId='mashroom-remote-messaging-app-form' initialValues={this.getInitialValues()} onSubmit={this.onSubmit.bind(this)} validator={this.validate.bind(this)}>
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
    }

}
