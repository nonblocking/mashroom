
import React, {PureComponent} from 'react';
import {injectIntl} from 'react-intl';
import {Field} from 'redux-form';
import TextField from '../components/TextField';

import type {WrappedFieldProps} from 'redux-form';
import type {IntlShape} from 'react-intl';

type OwnProps = {
    id: string;
    name: string;
    labelId: string;
    type?: 'text' | 'number' | 'tel' | 'email' | 'search';
    maxLength?: number;
    pattern?: string;
    autoComplete?: string;
    placeholder?: string;
}

type IntlProps = {
    intl: IntlShape
}

type Props = OwnProps & IntlProps;

class TextFieldContainer extends PureComponent<Props> {

    render() {
        return <Field name={this.props.name} component={(fieldProps: WrappedFieldProps) => <TextField fieldProps={fieldProps} {...this.props}/>}/>;
    }
}

export default injectIntl(TextFieldContainer);
