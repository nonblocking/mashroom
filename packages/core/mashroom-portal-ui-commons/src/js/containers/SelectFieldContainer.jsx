// @flow

import React, {PureComponent} from 'react';
import {injectIntl} from 'react-intl';
import {Field} from 'redux-form';
import SelectField, {NULL_VALUE} from '../components/SelectField';

import type {FieldProps} from 'redux-form';
import type {Node, ComponentType} from 'react';
import type {IntlShape} from 'react-intl';

type OwnProps = {
    id: string,
    name: string,
    labelId: string,
    options: Array<{value: ?string, label: Node}>,
    multiple?: boolean,
    emptyOption?: boolean,
    placeholder?: string,
    onValueChange?: (value: ?string) => void,
}

type IntlProps = {
    intl: IntlShape
}

class SelectFieldContainer extends PureComponent<OwnProps & IntlProps> {

    render() {
        return <Field
            name={this.props.name}
            normalize={(value: ?string) => value === NULL_VALUE ? null : value}
            component={(fieldProps: FieldProps): Node => <SelectField fieldProps={fieldProps} {...this.props}/>}
        />;
    }
}

export default (injectIntl(SelectFieldContainer): ComponentType<OwnProps>);
