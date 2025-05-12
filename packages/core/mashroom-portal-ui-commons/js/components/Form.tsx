
import React, {useCallback, useEffect, useRef} from 'react';

import type {ReactNode, FormEvent} from 'react';
import type {FormikTouched} from 'formik/';
import type {ValidationErrors, FormContext} from '../../type-definitions';

const getTouchedObj = (errors: any) => {
    const touched: FormikTouched<any> = {};
    Object.keys(errors).map(key => {
        const errorObj = errors[key];
        if (Array.isArray(errorObj)) {
            errorObj.map((val: any, index: any) => {
                if (index == 0) {
                    touched[key] = [];
                }
                (touched[key] as any).push(getTouchedObj(val));
            });
        } else if (typeof (errorObj) === 'string') {
            touched[key] = true;
        } else if (errorObj && typeof (errorObj) === 'object') {
            touched[key] = getTouchedObj(errorObj);
        }
    });
    return touched;
};

const hasError = (errors: any, path: string): boolean => {
    const props = path.split('.');
    let parent: any = errors;
    for (const prop of props) {
        parent = parent[prop];
        if (!parent) {
            return false;
        }
    }
    return true;
};

type Props = {
    id: string;
    initialValues: any;
    values: any;
    errors: ValidationErrors;
    handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
    resetForm: () => void;
    setTouched: (touched: FormikTouched<any>) => void;
    setFieldValue: (field: string, value: any) => void;
    onChange?: (values: any, previousValues: any, context: FormContext) => void;
    children: ReactNode;
};

export default ({id, initialValues, values, errors, handleSubmit, resetForm, setTouched, setFieldValue, onChange, children}: Props) => {
    const formRef = useRef<HTMLFormElement | null>(null);
    const lastValues = useRef<any>(null);

    useEffect(() => {
        if (onChange && lastValues.current) {
            onChange(values, lastValues.current, {
                resetForm,
                setFieldValue,
                initialValues,
            });
        }
        lastValues.current = values;
    }, [values]);

    const focusFirstErroneousField = () => {
        if (Object.keys(errors).length === 0) {
            return;
        }
        const elements = (formRef.current || document).querySelectorAll('input, select, textarea');
        for (let i = 0; i < elements.length; i++) {
            const elem: any = elements[i];
            if (elem.name) {
                if (errors && hasError(errors, elem.name)) {
                    console.info('Focusing erroneous field: ', elem);
                    elem.focus();
                    break;
                }
            }
        }
    };

    const onSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
        setTimeout(() => {
            setTouched(getTouchedObj(errors));
            focusFirstErroneousField();
        }, 100);
        handleSubmit(e);
    }, [errors, handleSubmit]);

    return (
        <div className='mashroom-portal-ui-form'>
            <form id={id} onSubmit={onSubmit} ref={formRef}>
                {children}
            </form>
        </div>
    );
};
