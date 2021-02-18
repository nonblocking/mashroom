
import React, {PureComponent} from 'react';
import ErrorMessage from './ErrorMessage';
import FieldLabel from './FieldLabel';

import type {ChangeEvent} from 'react';
import type {WrappedFieldProps} from 'redux-form';
import type {IntlShape} from 'react-intl';
import type {SelectFieldOptions} from '../../type-definitions';

type Props = {
    id: string;
    labelId: string;
    options: SelectFieldOptions;
    emptyOption?: boolean;
    placeholder?: string;
    onValueChange?: (value: string | undefined | null) => void;
    fieldProps: WrappedFieldProps;
    intl: IntlShape;
}

export const NULL_VALUE = '__null__';

export default class SelectField extends PureComponent<Props> {

    onChange(value: string | undefined | null) {
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
        this.props.options.forEach((option) => {
            options.push(<option key={option.value} value={option.value || NULL_VALUE}>{option.label}</option>);
        });

        return options;
    }

    render() {
        const error = this.props.fieldProps.meta.touched && !!this.props.fieldProps.meta.error;

        const placeholder = this.props.placeholder ? this.props.intl.formatMessage({ id: this.props.placeholder }) : null;

        const inputProps: any = {
            ...this.props.fieldProps.input,
            id: this.props.id,
            placeholder,
            onChange: (e: ChangeEvent<HTMLSelectElement>) => this.onChange(e.target.value)};

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

