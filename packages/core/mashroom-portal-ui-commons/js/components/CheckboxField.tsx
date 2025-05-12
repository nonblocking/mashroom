
import React from 'react';
import {useField} from 'formik';
import ErrorMessage from './ErrorMessage';
import FieldLabel from './FieldLabel';

type Props = {
    id: string;
    name: string;
    labelId?: string;
}

export default ({id, name, labelId}: Props) => {
    const [field, meta] = useField(name);

    const error = meta.touched && !!meta.error;
    const inputProps = {
        ...field,
        value: field.value || false,
        id,
        type: 'checkbox',
        checked: !!field.value
    };

    return  (
        <div className={`mashroom-portal-ui-checkbox-field mashroom-portal-ui-input ${error ? 'error' : ''}`}>
            <input className='mashroom-portal-checkbox' {...inputProps}/>
            {labelId ? <FieldLabel htmlFor={id} labelId={labelId}/> : <label htmlFor={id}>&nbsp;</label>}
            {error && <ErrorMessage messageId={meta.error || ''}/>}
        </div>
    );
};
