
import React from 'react';
import {useField} from 'formik';
import {useIntl} from 'react-intl';
import ErrorMessage from './ErrorMessage';
import FieldLabel from './FieldLabel';

type Props = {
    id: string;
    name: string;
    labelId: string;
    rows?: number;
    maxLength?: number;
    placeholder?: string;
}

export default ({id, name, labelId, rows, maxLength, placeholder: placeHolderId}: Props) => {
    const [field, meta] = useField(name);
    const intl = useIntl();

    const error = meta.touched && !!meta.error;
    const placeholder = placeHolderId ? intl.formatMessage({ id: placeHolderId }) : null;
    const inputProps: any = {
        ...field,
        id,
        value: field.value || '',
        rows: rows || 3,
        maxLength,
        placeholder
    };

    return (
        <div className={`mashroom-portal-ui-textarea-field mashroom-portal-ui-input ${error ? 'error' : ''}`}>
            <FieldLabel htmlFor={id} labelId={labelId}/>
            <div>
                <textarea {...inputProps}/>
                {error && <ErrorMessage messageId={meta.error || ''}/>}
            </div>
        </div>
    );
};

