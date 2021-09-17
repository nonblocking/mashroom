
import React, {PureComponent} from 'react';
import ErrorMessage from './ErrorMessage';
import FieldLabel from './FieldLabel';

import type {ReactNode, ChangeEvent} from 'react';
import type {FieldProps} from 'formik';
import type {IntlShape} from 'react-intl';
import type {SelectFieldOptions} from '../../type-definitions';

type Props = {
    id: string;
    labelId: string;
    options: SelectFieldOptions;
    emptyOption?: boolean;
    placeholder?: string;
    onValueChange?: (value: string | undefined | null) => void;
    fieldProps: FieldProps;
    intl: IntlShape;
}

export const NULL_VALUE = '__null__';

export default class SelectField extends PureComponent<Props> {

    onChange(e: ChangeEvent<HTMLSelectElement>): void {
        const {fieldProps: {field}, onValueChange} = this.props;
        let value: string | null = e.target.value;
        if (value === NULL_VALUE) {
            value = null;
        }
        field.onChange(e);
        if (onValueChange) {
            onValueChange(value);
        }
    }

    renderOptions(): ReactNode {
        const {emptyOption, options} = this.props;
        const optionComps = [];

        if (emptyOption) {
            optionComps.push(<option key='empty' value={NULL_VALUE} />);
        }
        options.forEach((option) => {
            optionComps.push(<option key={option.value} value={option.value || NULL_VALUE}>{option.label}</option>);
        });

        return optionComps;
    }

    render(): ReactNode {
        const {id, labelId, fieldProps: {field, meta}, placeholder: placeholderId, intl} = this.props;
        const error = meta.touched && !!meta.error;
        const placeholder = placeholderId ? intl.formatMessage({ id: placeholderId }) : null;

        const inputProps: any = {
            ...field,
            id,
            value: field.value || '',
            placeholder,
            onChange: (e: ChangeEvent<HTMLSelectElement>) => this.onChange(e)};

        return (
            <div className={`mashroom-portal-ui-select-field mashroom-portal-ui-input ${error ? 'error' : ''}`}>
                <FieldLabel htmlFor={id} labelId={labelId}/>
                <div>
                    <select {...inputProps}>
                        {this.renderOptions()}
                    </select>
                    {error && <ErrorMessage messageId={meta.error || ''}/>}
                </div>
            </div>
        );
    }
}

