
import React, {PureComponent} from 'react';
import {injectIntl} from 'react-intl';
import {Field} from 'formik';
import TextFieldComp from '../components/TextField';

import type {FieldProps} from 'formik';
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

class TextField extends PureComponent<Props> {

    render() {
        const {name} = this.props;
        return (
            <Field name={name} >
                {(fieldProps: FieldProps) => <TextFieldComp fieldProps={fieldProps} {...this.props}/>}
            </Field>
        );
    }
}

export default injectIntl(TextField);
