
import React, {useCallback} from 'react';
import {useField} from 'formik';
import {useIntl} from 'react-intl';
import ErrorMessage from './ErrorMessage';
import FieldLabel from './FieldLabel';

import type {ChangeEvent} from 'react';
import type {SelectFieldOptions} from '../../type-definitions';

type Props = {
    id: string;
    name: string;
    labelId: string;
    options: SelectFieldOptions;
    emptyOption?: boolean;
    placeholder?: string;
    onValueChange?: (value: string | undefined | null) => void;
}

export const NULL_VALUE = '__null__';

export default ({id, name, labelId, options, emptyOption, placeholder: placeholderId, onValueChange}: Props) => {
    const [field, meta] = useField(name);
    const intl = useIntl();

    const error = meta.touched && !!meta.error;
    const placeholder = placeholderId ? intl.formatMessage({ id: placeholderId }) : null;

    const onChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
        let value: string | null = e.target.value;
        if (value === NULL_VALUE) {
            value = null;
        }
        const syntheticEvent = {
            target: {
                name: field.name,
                value,
            }
        };
        field.onChange(syntheticEvent);
        if (onValueChange) {
            onValueChange(value);
        }
    }, [field, onValueChange]);

    const inputProps: any = {
        ...field,
        id,
        value: field.value || '',
        placeholder,
        onChange,
    };

    return (
        <div className={`mashroom-portal-ui-select-field mashroom-portal-ui-input ${error ? 'error' : ''}`}>
            <FieldLabel htmlFor={id} labelId={labelId}/>
            <div>
                <select {...inputProps}>
                    {emptyOption && (
                        <option key='empty' value={NULL_VALUE} />
                    )}
                    {options.map((option) => (
                        <option key={option.value} value={option.value || NULL_VALUE}>{option.label}</option>
                    ))}
                </select>
                {error && <ErrorMessage messageId={meta.error || ''}/>}
            </div>
        </div>
    );
};

