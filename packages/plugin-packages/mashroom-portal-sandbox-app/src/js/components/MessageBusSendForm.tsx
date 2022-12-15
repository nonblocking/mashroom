
import React, {PureComponent} from 'react';
import {
    Form,
    SelectField,
    SourceCodeEditorField,
    Button
} from '@mashroom/mashroom-portal-ui-commons';

import type {ReactNode} from 'react';
import type {MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions';
import type {FormContext} from '@mashroom/mashroom-portal-ui-commons/type-definitions';
import type {ActivePortalApp, MessageBusMessage} from '../types';

type FormData = {
    topic: string;
    message: string;
}

type Props = {
    messageBus: MashroomPortalMessageBus;
    activePortalApp: ActivePortalApp | undefined | null;
    topicsSubscribedByApp: Array<string>;
    addMessagePublishedBySandbox: (messageBus: MessageBusMessage) => void;
}

export default class MessageBusSendForm extends PureComponent<Props> {

    sbAutoTest = Number(new URLSearchParams(window.location.search).get('sbAutoTest'));

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
        }
        try {
            JSON.parse(message);
        } catch (e) {
            errors.message = 'errorInvalidJSON';
        }

        return errors;
    }

    onSubmit(values: FormData, context: FormContext): void {
        const { messageBus, addMessagePublishedBySandbox } = this.props;
        const { topic, message } = values;

        const inputFieldValue : string = (document.querySelector('#mashroom-sandbox-publish-message-message') as HTMLInputElement)?.value;

        const data = JSON.parse(this.sbAutoTest === 1 ? inputFieldValue : message);
        
        messageBus.publish(topic, data);
        addMessagePublishedBySandbox({
            topic,
            data
        });
        context.resetForm();
    }

    render(): ReactNode {
        const {activePortalApp, topicsSubscribedByApp} = this.props;
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
                        <SelectField id='mashroom-sandbox-publish-message-topic' name='topic' labelId='topic' options={topicOptions} emptyOption={true} />
                    </div>
                    <div className='mashroom-sandbox-app-form-row'>
                        { this.sbAutoTest === 0 && <SourceCodeEditorField id='mashroom-sandbox-publish-message-message' name="message" labelId='message' language='json' theme='light' height={120} /> }
                        { this.sbAutoTest === 1 && <input type="text" name="message" id='mashroom-sandbox-publish-message-message' /> }
                    </div>
                    <div className='mashroom-sandbox-app-form-button-row'>
                        <Button id='mashroom-sandbox-publish-message' type='submit' labelId='sendMessage'/>
                    </div>
                </Form>
            </div>
        );
    }

}
