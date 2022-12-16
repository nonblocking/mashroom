
import React, {PureComponent} from 'react';
import {
    Form,
    SelectField,
    SourceCodeEditorField,
    Button,
    TextareaField
} from '@mashroom/mashroom-portal-ui-commons';

import type {ReactNode} from 'react';
import type {MashroomPortalMessageBus, MashroomPortalStateService} from '@mashroom/mashroom-portal/type-definitions';
import type {FormContext} from '@mashroom/mashroom-portal-ui-commons/type-definitions';
import type {ActivePortalApp, MessageBusMessage} from '../types';

type FormData = {
    topic: string;
    message: string;
}

type Props = {
    messageBus: MashroomPortalMessageBus;
    portalStateService: MashroomPortalStateService;
    activePortalApp: ActivePortalApp | undefined | null;
    topicsSubscribedByApp: Array<string>;
    addMessagePublishedBySandbox: (messageBus: MessageBusMessage) => void;
    sbAutoTest: boolean;
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

        const data = JSON.parse(message);
        
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
                        { !this.props.sbAutoTest ?
                        <SourceCodeEditorField id='mashroom-sandbox-publish-message-message' name="message" labelId='message' language='json' theme='light' height={120} /> : 
                        <TextareaField id='mashroom-sandbox-publish-message-message' name="message" labelId='message' /> }
                    </div>
                    <div className='mashroom-sandbox-app-form-button-row'>
                        <Button id='mashroom-sandbox-publish-message' type='submit' labelId='sendMessage'/>
                    </div>
                </Form>
            </div>
        );
    }

}
