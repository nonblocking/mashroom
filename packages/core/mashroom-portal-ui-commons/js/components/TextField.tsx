
import React, {PureComponent} from 'react';
import ErrorMessage from './ErrorMessage';
import FieldLabel from './FieldLabel';

import type {ReactNode} from 'react';
import type {FieldProps} from 'formik';
import type {IntlShape} from 'react-intl';

type Props = {
    id: string;
    labelId: string;
    type?: 'text' | 'number' | 'tel' | 'email' | 'search';
    maxLength?: number;
    pattern?: string;
    autoComplete?: string;
    placeholder?: string;
    fieldProps: FieldProps;
    intl: IntlShape;
}

export default class TextField extends PureComponent<Props> {

    render(): ReactNode {
        const {id, labelId, fieldProps: {field, meta}, type, autoComplete, maxLength, pattern, placeholder: placeholderId, intl} = this.props;
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
    }
}

