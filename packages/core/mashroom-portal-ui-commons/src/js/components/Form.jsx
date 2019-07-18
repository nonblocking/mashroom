// @flow

import React, {PureComponent} from 'react';
import {reduxForm} from 'redux-form';

import type {Node} from 'React';
import type {FormProps} from 'redux-form';
import type {FormValidator, ValidationErrors} from '../../../type-definitions';

type Props = {
    formId: string,
    initialValues?: any,
    validator?: FormValidator,
    onSubmit?: (values: any) => void,
    onChange?: (values: any) => void,
    children: Node,
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
                    break;
                }
            }
        }
    }

    errorExists(path: string, errors: ValidationErrors) {
        const props = path.split('.');
        let parent: Object = errors;
        for (const prop of props) {
            parent = parent[prop];
            if (!parent) {
                return false;
            }
        }
        return true;
    }

    createForm() {
        const HtmlForm = (props: FormProps) => (
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
