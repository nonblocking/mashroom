
import React, {PureComponent} from 'react';
import {injectIntl} from 'react-intl';
import {Field} from 'formik';
import TextareaFieldComp from '../components/TextareaField';

import type {FieldProps} from 'formik';
import type {IntlShape} from 'react-intl';

type OwnProps = {
    id: string;
    name: string;
    labelId: string;
    rows?: number;
    maxLength?: number;
    placeholder?: string;
}

type IntlProps = {
    intl: IntlShape
}

type Props = OwnProps & IntlProps;

class TextareaField extends PureComponent<Props> {

    render() {
        const {name} = this.props;
        return (
            <Field name={name} >
                {(fieldProps: FieldProps) => <TextareaFieldComp fieldProps={fieldProps} {...this.props}/>}
            </Field>
        );
    }
}

export default injectIntl(TextareaField);
