
import React, {PureComponent} from 'react';
import {Formik} from 'formik';
import FormComp from '../components/Form';

import type {ReactNode} from 'react';
import type {FormikProps, FormikHelpers} from 'formik';
import type {FormContext, FormValidator, ValidationErrors} from '../../type-definitions';

type Props = {
    formId: string;
    initialValues?: any;
    validator?: FormValidator;
    onSubmit: (values: any, context: FormContext) => void;
    onChange?: (values: any, previousValues: any, context: FormContext) => void;
    children: ReactNode;
};

export default class Form extends PureComponent<Props> {

    handleOnSubmit(values: any, helpers: FormikHelpers<any>) {
        const {onSubmit, initialValues} = this.props;
        const {resetForm, setFieldValue} = helpers;
        onSubmit(values, {
            resetForm,
            setFieldValue,
            initialValues,
        });
    }

    handleValidate(values: any) {
        let errors: ValidationErrors | undefined;
        const {validator} = this.props;
        if (validator) {
            errors = validator(values);
        }
        return errors;
    }

    render() {
        const {initialValues, formId, onChange, children} = this.props;
        return (
            <div className='mashroom-portal-ui-form'>
                <Formik
                    initialValues={initialValues}
                    onSubmit={this.handleOnSubmit.bind(this)}
                    validate={this.handleValidate.bind(this)}
                    enableReinitialize
                    validateOnChange
                    validateOnMount
                >
                    {({handleSubmit, values, errors, resetForm, setFieldValue, setTouched}: FormikProps<any>) => (
                        <FormComp
                            id={formId}
                            handleSubmit={handleSubmit}
                            values={values}
                            initialValues={initialValues}
                            errors={errors}
                            resetForm={resetForm}
                            setTouched={setTouched}
                            setFieldValue={setFieldValue}
                            onChange={onChange}>
                            {children}
                        </FormComp>
                    )}
                </Formik>
            </div>
        );
    }

}
