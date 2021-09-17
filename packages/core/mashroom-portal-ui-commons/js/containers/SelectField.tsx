
import React, {PureComponent} from 'react';
import {injectIntl} from 'react-intl';
import {Field} from 'formik';
import SelectFieldComp from '../components/SelectField';

import type {FieldProps} from 'formik';
import type {IntlShape} from 'react-intl';
import type {SelectFieldOptions} from '../../type-definitions';

type OwnProps = {
    id: string;
    name: string;
    labelId: string;
    options: SelectFieldOptions;
    multiple?: boolean;
    emptyOption?: boolean;
    placeholder?: string;
    onValueChange?: (value: string | undefined | null) => void;
}

type IntlProps = {
    intl: IntlShape
}

type Props = OwnProps & IntlProps;

class SelectField extends PureComponent<Props> {

    render() {
        const {name} = this.props;
        return (
            <Field name={name}>
                {(fieldProps: FieldProps) => <SelectFieldComp fieldProps={fieldProps} {...this.props}/>}
            </Field>
        );
    }
}

export default injectIntl(SelectField);
