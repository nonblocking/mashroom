
import React, {PureComponent} from 'react';
import {Field} from 'formik';
import SourceCodeEditorFieldComp from '../components/SourceCodeEditorField';

import type {FieldProps} from 'formik';

type Props = {
    id: string;
    name: string;
    labelId: string;
    language: 'json' | 'css';
    theme?: 'light' | 'dark';
    height?: number;
}

export default class SourceCodeEditorField extends PureComponent<Props> {

    render() {
        const {name} = this.props;
        return (
            <Field name={name}>
                {(fieldProps: FieldProps) => <SourceCodeEditorFieldComp fieldProps={fieldProps} {...this.props}/>}
            </Field>
        );
    }
}
