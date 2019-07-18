// @flow

import React, {PureComponent} from 'react';
import {injectIntl} from 'react-intl';
import {Field} from 'redux-form';
import TextareaField from '../components/TextareaField';

import type {Node, ComponentType} from 'react';
import type {FieldProps} from 'redux-form';
import type {IntlShape} from 'react-intl';

type OwnProps = {
    id: string,
    name: string,
    labelId: string,
    rows?: number,
    maxLength?: number,
    placeholder?: string,
}

type IntlProps = {
    intl: IntlShape
}

class TextareaFieldContainer extends PureComponent<OwnProps & IntlProps> {

    render() {
        return <Field name={this.props.name} component={(fieldProps: FieldProps): Node => <TextareaField fieldProps={fieldProps} {...this.props}/>}/>;
    }
}

export default (injectIntl(TextareaFieldContainer): ComponentType<OwnProps>);
