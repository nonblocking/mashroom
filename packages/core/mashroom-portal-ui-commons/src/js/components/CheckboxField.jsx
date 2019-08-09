// @flow

import React, {PureComponent} from 'react';
import ErrorMessage from './ErrorMessage';
import FieldLabel from './FieldLabel';

import type {FieldProps} from 'redux-form';

type Props = {
    id: string,
    labelId?: string,
    fieldProps: FieldProps
}

export default class CheckboxField extends PureComponent<Props> {

    render() {
        const error = this.props.fieldProps.meta.touched && !!this.props.fieldProps.meta.error;

        const inputProps = Object.assign({}, this.props.fieldProps.input, {
            id: this.props.id,
            type: 'checkbox',
            checked: !!this.props.fieldProps.input.value
        });

        return (
            <div className={`mashroom-portal-ui-checkbox-field mashroom-portal-ui-input ${error ? 'error' : ''}`}>
                <input className='mashroom-portal-checkbox' {...inputProps}/>
                {this.props.labelId ? <FieldLabel htmlFor={this.props.id} labelId={this.props.labelId}/> : <label htmlFor={this.props.id}>&nbsp;</label>}
                {error && <ErrorMessage messageId={this.props.fieldProps.meta.error || ''}/>}
            </div>
        );
    }

}
