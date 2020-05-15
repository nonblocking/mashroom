// @flow

import React, {PureComponent} from 'react';
import ErrorMessage from './ErrorMessage';
import FieldLabel from './FieldLabel';

import type {FieldProps} from 'redux-form';
import type {Node} from 'react';
import type {IntlShape} from 'react-intl';

type Props = {
    id: string,
    labelId: string,
    options: Array<{value: ?string, label: Node}>,
    emptyOption?: boolean,
    placeholder?: string,
    onValueChange?: (value: ?string) => void,
    fieldProps: FieldProps,
    intl: IntlShape
}

export const NULL_VALUE = '__null__';

export default class SelectField extends PureComponent<Props> {

    onChange(value: ?string) {
        if (value === NULL_VALUE) {
            value = null;
        }
        this.props.fieldProps.input.onChange(value);
        if (this.props.onValueChange) {
            this.props.onValueChange(value);
        }
    }

    renderOptions() {
        const options = [];

        if (this.props.emptyOption) {
            options.push(<option key='empty' value={NULL_VALUE} />);
        }
        for (const option of this.props.options) {
            options.push(<option key={option.value} value={option.value || NULL_VALUE}>{option.label}</option>);
        }

        return options;
    }

    render() {
        const error = this.props.fieldProps.meta.touched && !!this.props.fieldProps.meta.error;

        const placeholder = this.props.placeholder ? this.props.intl.formatMessage({ id: this.props.placeholder }) : null;

        const inputProps = {...this.props.fieldProps.input, id: this.props.id,
            placeholder,
            onChange: (e) => this.onChange(e.target.value)};

        return (
            <div className={`mashroom-portal-ui-select-field mashroom-portal-ui-input ${error ? 'error' : ''}`}>
                <FieldLabel htmlFor={this.props.id} labelId={this.props.labelId}/>
                <div>
                    <select {...inputProps}>
                        {this.renderOptions()}
                    </select>
                    {error && <ErrorMessage messageId={this.props.fieldProps.meta.error || ''}/>}
                </div>
            </div>
        );
    }
}

