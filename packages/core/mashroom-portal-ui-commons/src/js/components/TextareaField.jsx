// @flow

import React, {PureComponent} from 'react';
import ErrorMessage from './ErrorMessage';
import FieldLabel from './FieldLabel';

import type {FieldProps} from 'redux-form';
import type {IntlShape} from 'react-intl';

type Props = {
    id: string,
    labelId: string,
    rows?: number,
    maxLength?: number,
    placeholder?: string,
    fieldProps: FieldProps,
    intl: IntlShape
}

export default class TextareaField extends PureComponent<Props> {

    render() {
        const error = this.props.fieldProps.meta.touched && !!this.props.fieldProps.meta.error;

        const placeholder = this.props.placeholder ? this.props.intl.formatMessage({ id: this.props.placeholder }) : null;

        const inputProps = Object.assign({}, this.props.fieldProps.input, {
            id: this.props.id,
            rows: this.props.rows || 3,
            placeholder
        });

        return (
            <div className={`mashroom-portal-ui-textarea-field mashroom-portal-ui-input ${error ? 'error' : ''}`}>
                <FieldLabel htmlFor={this.props.id} labelId={this.props.labelId}/>
                <div>
                    <textarea {...inputProps}/>
                    {error && <ErrorMessage messageId={this.props.fieldProps.meta.error || ''}/>}
                </div>
            </div>
        );
    }
}

