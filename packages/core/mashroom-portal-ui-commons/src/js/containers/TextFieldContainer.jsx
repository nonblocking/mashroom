// @flow

import React, {PureComponent} from 'react';
import {injectIntl} from 'react-intl';
import {Field} from 'redux-form';
import TextField from '../components/TextField';

import type {Node, ComponentType} from 'react';
import type {FieldProps} from 'redux-form';
import type {IntlShape} from 'react-intl';

type OwnProps = {
    id: string,
    name: string,
    labelId: string,
    type?: 'text' | 'number' | 'tel' | 'email' | 'search',
    maxLength?: number,
    pattern?: string,
    autoComplete?: string,
    placeholder?: string,
}

type IntlProps = {
    intl: IntlShape
}

class TextFieldContainer extends PureComponent<OwnProps & IntlProps> {

    render() {
        return <Field name={this.props.name} component={(fieldProps: FieldProps): Node => <TextField fieldProps={fieldProps} {...this.props}/>}/>;
    }
}

export default (injectIntl(TextFieldContainer): ComponentType<OwnProps>);
