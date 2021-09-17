
import React, {PureComponent} from 'react';
import ErrorMessage from './ErrorMessage';
import FieldLabel from './FieldLabel';

import type {ReactNode} from 'react';
import type {FieldProps} from 'formik';
import type {IntlShape} from 'react-intl';

type Props = {
    id: string;
    labelId: string;
    rows?: number;
    maxLength?: number;
    placeholder?: string;
    fieldProps: FieldProps;
    intl: IntlShape;
}

export default class TextareaField extends PureComponent<Props> {

    render(): ReactNode {
        const {id, labelId, fieldProps: {field, meta}, placeholder: placeholderId, rows, intl} = this.props;
        const error = meta.touched && !!meta.error;
        const placeholder = placeholderId ? intl.formatMessage({ id: placeholderId }) : null;

        const inputProps: any = {
            ...field,
            id,
            value: field.value || '',
            rows: rows || 3,
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
    }
}

