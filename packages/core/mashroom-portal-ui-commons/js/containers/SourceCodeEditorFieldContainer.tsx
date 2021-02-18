
import React, {PureComponent} from 'react';
import {Field} from 'redux-form';
import SourceCodeEditorField from '../components/SourceCodeEditorField';

import type {WrappedFieldProps} from 'redux-form';

type Props = {
    name: string;
    labelId: string;
    language: 'javascript' | 'json' | 'css' | 'html';
    theme?: 'blackboard' | 'idea';
    height?: number;
}

export default class SourceCodeEditorFieldContainer extends PureComponent<Props> {

    render() {
        return <Field name={this.props.name} component={(fieldProps: WrappedFieldProps) => <SourceCodeEditorField fieldProps={fieldProps} {...this.props}/>}/>;
    }
}
