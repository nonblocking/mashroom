
import React, {PureComponent} from 'react';
import {Field} from 'formik';
import SourceCodeEditorFieldComp from '../components/SourceCodeEditorField';

import type {ReactNode} from 'react';
import type {FieldProps} from 'formik';

type Props = {
    id: string;
    name: string;
    labelId: string;
    language: 'javascript' | 'json' | 'css' | 'html';
    theme?: 'blackboard' | 'idea';
    height?: number;
}

export default class SourceCodeEditorField extends PureComponent<Props> {

    render(): ReactNode {
        const {name} = this.props;
        return (
            <Field name={name} >
                {(fieldProps: FieldProps) => <SourceCodeEditorFieldComp fieldProps={fieldProps} {...this.props}/>}
            </Field>
        );
    }
}
