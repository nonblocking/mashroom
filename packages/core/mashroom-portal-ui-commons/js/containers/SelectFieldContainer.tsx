
import React, {PureComponent} from 'react';
import {injectIntl} from 'react-intl';
import {Field} from 'redux-form';
import SelectField, {NULL_VALUE} from '../components/SelectField';

import type {WrappedFieldProps} from 'redux-form';
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

class SelectFieldContainer extends PureComponent<Props> {

    render() {
        return <Field
            name={this.props.name}
            normalize={(value: string | undefined | null) => value === NULL_VALUE ? null : value}
            component={(fieldProps: WrappedFieldProps) => <SelectField fieldProps={fieldProps} {...this.props}/>}
        />;
    }
}

export default injectIntl(SelectFieldContainer);
