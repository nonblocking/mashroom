// @flow

import React, {PureComponent} from 'react';
import {
    Form,
    SelectFieldContainer,
    TextareaFieldContainer,
    Button
} from '@mashroom/mashroom-portal-ui-commons';

import type {MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions';
import type {ActivePortalApp, MessageBusMessage} from '../../../type-definitions';

type Props = {
    messageBus: MashroomPortalMessageBus,
    activePortalApp: ?ActivePortalApp,
    topicsSubscribedByApp: Array<string>,
    addMessagePublishedBySandbox: (MessageBusMessage) => void,
    resetForm: (string) => void,
}

export default class MessageBusSendForm extends PureComponent<Props> {

    getInitialValues() {
        return {
            topic: '',
            message: `{

}`
        }
    }

    validate(values: Object) {
        const errors = {};
        const { topic, message } = values;

        if (!topic || !topic.trim()) {
            errors.topic = 'errorTopicMandatory';
        }
        try {
            JSON.parse(message);
        } catch (e) {
            errors.message = 'errorInvalidJSON';
        }

        return errors;
    }

    onSubmit(values: any) {
        const { messageBus, addMessagePublishedBySandbox, resetForm } = this.props;
        const { topic, message } = values;
        const data = JSON.parse(message);
        messageBus.publish(topic, data);
        addMessagePublishedBySandbox({
            topic,
            data
        });
        // resetForm('mashroom-sandbox-app-publish-message-form');
    }

    render() {
        const { activePortalApp, topicsSubscribedByApp} = this.props;
        if (!activePortalApp) {
            return null;
        }

        const topicOptions = topicsSubscribedByApp.map((t) => ({
            value: t,
            label: t
        }));

        return (
            <div className='mashroom-sandbox-app-messagebus-publish-form'>
                <Form formId='mashroom-sandbox-app-publish-message-form' initialValues={this.getInitialValues()} onSubmit={this.onSubmit.bind(this)} validator={this.validate.bind(this)}>
                    <div className='mashroom-sandbox-app-form-row'>
                        <SelectFieldContainer id='mashroom-sandbox-publish-message-topic' name='topic' labelId='topic' options={topicOptions} emptyOption={true} />
                    </div>
                    <div className='mashroom-sandbox-app-form-row'>
                        <TextareaFieldContainer id='mashroom-sandbox-publish-message-message' name='message' labelId='message' rows={4} />
                    </div>
                    <div className='mashroom-sandbox-app-form-button-row'>
                        <Button id='mashroom-sandbox-publish-message' type='submit' labelId='publishMessage'/>
                    </div>
                </Form>
            </div>
        );
    }

}
