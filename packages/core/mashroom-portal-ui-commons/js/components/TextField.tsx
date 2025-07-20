
import React from 'react';
import {useField} from 'formik';
import {useTranslation} from 'react-i18next';
import ErrorMessage from './ErrorMessage';
import FieldLabel from './FieldLabel';

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
    const [field, meta] = useField(name);
    const {t} = useTranslation();

    const error = meta.touched && !!meta.error;
    const placeholder = placeholderId ? t(placeholderId) : null;
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
};

