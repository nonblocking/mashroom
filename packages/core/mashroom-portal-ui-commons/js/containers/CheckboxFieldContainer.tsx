
import React, {PureComponent} from 'react';
import {Field} from 'redux-form';
import CheckboxField from '../components/CheckboxField';

import type {WrappedFieldProps} from 'redux-form';

type Props = {
    name: string;
    id: string;
    labelId?: string;
}

export default class CheckboxFieldContainer extends PureComponent<Props> {

    render() {
        return <Field name={this.props.name} component={(fieldProps: WrappedFieldProps) => <CheckboxField fieldProps={fieldProps} {...this.props}/>}/>;
    }
}
