
import React, {useCallback} from 'react';
import {
    Form,
    SelectField,
    SourceCodeEditorField,
    Button,
    TextareaField
} from '@mashroom/mashroom-portal-ui-commons';
import {addMessagePublishedBySandbox as addMessagePublishedBySandboxAction} from '../store/actions';
import useStore from '../store/useStore';

import type {MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions';
import type {FormContext} from '@mashroom/mashroom-portal-ui-commons/type-definitions';
import type {MessageBusMessage} from '../types';

type FormData = {
    topic: string;
    message: string;
}

type Props = {
    messageBus: MashroomPortalMessageBus;
    sbAutoTest: boolean;
}


const initialValues: FormData = {
    topic: '',
    message: `{

}`
};

export default ({ messageBus, sbAutoTest}: Props) => {
    const activePortalApp = useStore((state) => state.activePortalApp);
    const {topicsSubscribedByApp} = useStore((state) => state.messageBusCom);
    const dispatch = useStore((state) => state.dispatch);
    const addMessagePublishedBySandbox = (message: MessageBusMessage) => dispatch(addMessagePublishedBySandboxAction(message));

    const validate = useCallback((values: FormData) => {
        const errors: { [k in keyof FormData]?: string } = {};
        const {topic, message} = values;

        if (!topic || !topic.trim()) {
            errors.topic = 'errorTopicMandatory';
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
        const data = JSON.parse(message);

        messageBus.publish(topic, data);
        addMessagePublishedBySandbox({
            topic,
            data
        });
        context.resetForm();
    }, []);

    if (!activePortalApp) {
        return null;
    }

    const topicOptions = topicsSubscribedByApp.map((t) => ({
        value: t,
        label: t
    }));

    return (
        <div className='mashroom-sandbox-app-messagebus-publish-form'>
            <Form formId='mashroom-sandbox-app-publish-message-form' initialValues={initialValues} onSubmit={onSubmit} validator={validate}>
                <div className='mashroom-sandbox-app-form-row'>
                    <SelectField id='mashroom-sandbox-publish-message-topic' name='topic' labelId='topic' options={topicOptions} emptyOption={true} />
                </div>
                <div className='mashroom-sandbox-app-form-row'>
                    {!sbAutoTest &&
                        <SourceCodeEditorField id='mashroom-sandbox-publish-message-message' name="message" labelId='message' language='json' theme='light'
                                               height={120} />}
                    {sbAutoTest && <TextareaField id='mashroom-sandbox-publish-message-message' name="message" labelId='message' />}
                </div>
                <div className='mashroom-sandbox-app-form-button-row'>
                    <Button id='mashroom-sandbox-publish-message' type='submit' labelId='sendMessage' />
                </div>
            </Form>
        </div>
    );
};
