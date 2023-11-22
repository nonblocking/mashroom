
import React, {PureComponent} from 'react';
import ErrorMessage from './ErrorMessage';
import FieldLabel from './FieldLabel';
import type {FieldProps} from 'formik';

type Props = {
    id: string;
    labelId?: string;
    fieldProps: FieldProps;
}

export default class CheckboxField extends PureComponent<Props> {

    render() {
        const {id, labelId, fieldProps: {field, meta}} = this.props;
        const error = meta.touched && !!meta.error;

        const inputProps = {
            ...field,
            id,
            type: 'checkbox',
            checked: !!field.value
        };

        return (
            <div className={`mashroom-portal-ui-checkbox-field mashroom-portal-ui-input ${error ? 'error' : ''}`}>
                <input className='mashroom-portal-checkbox' {...inputProps}/>
                {labelId ? <FieldLabel htmlFor={id} labelId={labelId}/> : <label htmlFor={id}>&nbsp;</label>}
                {error && <ErrorMessage messageId={meta.error || ''}/>}
            </div>
        );
    }

}
