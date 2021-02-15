
import React, {PureComponent} from 'react';
import {reduxForm} from 'redux-form';

import type {ReactNode} from 'react';
import type {Dispatch} from 'redux';
import type {InjectedFormProps} from 'redux-form';
import type {AsyncFormValidator, FormValidator, ValidationErrors} from '../../type-definitions';

type Props = {
    formId: string;
    initialValues?: any;
    validator?: FormValidator;
    asyncValidator?: AsyncFormValidator;
    validateAsyncOnBlurFields?: Array<string>;
    onSubmit?: (values: any, dispatch: Dispatch<any>, props: any) => void;
    onChange?: (values: any, dispatch: Dispatch<any>, props: any, previousValues: any) => void;
    children: ReactNode;
};

export default class Form extends PureComponent<Props> {

    focusFirstErroneousField(errors: ValidationErrors) {
        const elements = document.querySelectorAll('input, select, textarea');
        for (let i = 0; i < elements.length; i++) {
            const elem: any = elements[i];
            if (elem.name) {
                if (errors && this.errorExists(elem.name, errors)) {
                    console.info('Focusing erroneous field: ', elem);
                    elem.focus();
                    // Fire a custom event that is used by the TabDialog to make the tab with the erronous element visible
                    const event = document.createEvent('Event');
                    event.initEvent('erroneous-field-focused', true, true);
                    elem.dispatchEvent(event);
                    break;
                }
            }
        }
    }

    errorExists(path: string, errors: ValidationErrors) {
        const props = path.split('.');
        let parent: any = errors;
        for (const prop of props) {
            parent = parent[prop];
            if (!parent) {
                return false;
            }
        }
        return true;
    }

    createForm() {
        const HtmlForm = (props: InjectedFormProps) => (
            <form onSubmit={props.handleSubmit}>
                {this.props.children}
            </form>
        );

        return reduxForm({
            form: this.props.formId,
            initialValues: this.props.initialValues,
            onSubmit: this.props.onSubmit,
            onChange: this.props.onChange,
            onSubmitFail: this.focusFirstErroneousField.bind(this),
            validate: this.props.validator,
            asyncValidate: this.props.asyncValidator,
            asyncBlurFields: this.props.validateAsyncOnBlurFields,
            destroyOnUnmount: false,
            enableReinitialize: true,
            keepDirtyOnReinitialize: false,
        })(HtmlForm);
    }

    render() {
        const Form = this.createForm();

        return (
            <div className='mashroom-portal-ui-form'>
                <Form/>
            </div>
        );
    }

}
