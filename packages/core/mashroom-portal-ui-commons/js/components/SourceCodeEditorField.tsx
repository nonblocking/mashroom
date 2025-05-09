
import React from 'react';
import {Field} from 'formik';
import SourceCodeEditor from './SourceCodeEditor';

import type {FieldProps} from 'formik';

type Props = {
    id: string;
    name: string;
    labelId: string;
    language: 'json' | 'css';
    theme?: 'light' | 'dark';
    height?: number;
}

export default (props: Props) => {
    return (
        <Field name={props.name}>
            {(fieldProps: FieldProps) => <SourceCodeEditor fieldProps={fieldProps} {...props}/>}
        </Field>
    );
};
