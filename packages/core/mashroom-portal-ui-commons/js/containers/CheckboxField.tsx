
import React, {PureComponent} from 'react';
import {Field} from 'formik';
import CheckboxFieldComp from '../components/CheckboxField';

import type {FieldProps} from 'formik';

type Props = {
    name: string;
    id: string;
    labelId?: string;
}

export default class CheckboxField extends PureComponent<Props> {

    render() {
        const {name} = this.props;
        return (
            <Field name={name}>
                {(fieldProps: FieldProps) => <CheckboxFieldComp fieldProps={fieldProps} {...this.props}/>}
            </Field>
        );
    }
}
