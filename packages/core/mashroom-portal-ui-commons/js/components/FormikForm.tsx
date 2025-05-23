
import React, {useCallback} from 'react';
import {Formik} from 'formik';
import Form from './Form';

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

export default ({formId, initialValues, validator, onSubmit, onChange, children}: Props) => {

    const handleOnSubmit = useCallback((values: any, helpers: FormikHelpers<any>) => {
        const {resetForm, setFieldValue} = helpers;
        onSubmit(values, {
            resetForm,
            setFieldValue,
            initialValues,
        });
    }, [onSubmit, initialValues]);

    const handleValidate = useCallback((values: any) => {
        let errors: ValidationErrors | undefined;
        if (validator) {
            errors = validator(values);
        }
        return errors;
    }, [validator]);

    return (
        <div className='mashroom-portal-ui-form'>
            <Formik
                initialValues={initialValues}
                onSubmit={handleOnSubmit}
                validate={handleValidate}
                enableReinitialize
                validateOnChange
                validateOnMount
            >
                {({handleSubmit, values, errors, resetForm, setFieldValue, setTouched}: FormikProps<any>) => (
                    <Form
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
                    </Form>
                )}
            </Formik>
        </div>
    );
};
