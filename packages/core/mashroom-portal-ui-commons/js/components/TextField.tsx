
import React from 'react';
import {Field} from 'formik';
import {useIntl} from 'react-intl';
import ErrorMessage from './ErrorMessage';
import FieldLabel from './FieldLabel';
import type { FieldProps} from 'formik';

type Props = {
    id: string;
    name: string;
    labelId: string;
    type?: 'text' | 'number' | 'tel' | 'email' | 'search';
    maxLength?: number;
    pattern?: string;
    autoComplete?: string;
    placeholder?: string;
}

export default ({id, name, labelId, type, maxLength, pattern, autoComplete, placeholder: placeholderId}: Props) => {
    const intl = useIntl();
    return (
        <Field name={name} >
            {({meta, field}: FieldProps) => {
                const error = meta.touched && !!meta.error;
                const placeholder = placeholderId ? intl.formatMessage({ id: placeholderId }) : null;

                const inputProps: any = {
                    ...field,
                    id,
                    value: field.value || '',
                    type: type || 'text',
                    autoComplete,
                    maxLength,
                    pattern,
                    placeholder
                };

                return (
                    <div className={`mashroom-portal-ui-text-field mashroom-portal-ui-input ${error ? 'error' : ''}`}>
                        <FieldLabel htmlFor={id} labelId={labelId}/>
                        <div>
                            <input {...inputProps}/>
                            {error && <ErrorMessage messageId={meta.error || ''}/>}
                        </div>
                    </div>
                );
            }}
        </Field>
    );
};

