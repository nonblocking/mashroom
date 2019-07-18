// @flow

import React, {PureComponent} from 'react';
import {Field} from 'redux-form';
import SourceCodeEditorField from '../components/SourceCodeEditorField';

import type {Node} from 'react';
import type {FieldProps} from 'redux-form';

type Props = {
    name: string,
    labelId: string,
    language: 'javascript' | 'json' | 'css' | 'html'
}

export default class SourceCodeEditorFieldContainer extends PureComponent<Props> {

    render() {
        return <Field name={this.props.name} component={(fieldProps: FieldProps): Node => <SourceCodeEditorField fieldProps={fieldProps} {...this.props}/>}/>;
    }
}
