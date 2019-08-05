// @flow

import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';
import FieldLabel from './FieldLabel';

import type {FieldProps} from 'redux-form';
import type {IntlShape} from 'react-intl';

type Props = {
    id: string,
    labelId: string,
    type?: 'text' | 'number' | 'tel' | 'email' | 'search',
    maxLength?: number,
    pattern?: string,
    autoComplete?: string,
    placeholder?: string,
    fieldProps: FieldProps,
    intl: IntlShape
}

export default class TextField extends PureComponent<Props> {

    render() {
        const error = this.props.fieldProps.meta.touched && !!this.props.fieldProps.meta.error;

        const placeholder = this.props.placeholder ? this.props.intl.formatMessage({ id: this.props.placeholder }) : null;

        const inputProps = Object.assign({}, this.props.fieldProps.input, {
            id: this.props.id,
            type: this.props.type || 'text',
            autoComplete: this.props.autoComplete,
            maxLength: this.props.maxLength,
            pattern: this.props.pattern,
            placeholder
        });

        return (
            <div className={`mashroom-portal-ui-text-field ${error ? 'error' : ''}`}>
                <FieldLabel htmlFor={this.props.id} labelId={this.props.labelId}/>
                <div>
                    <input {...inputProps}/>
                    {error && <div className='error-message'><FormattedMessage id={this.props.fieldProps.meta.error || ''}/></div>}
                </div>
            </div>
        );
    }
}

