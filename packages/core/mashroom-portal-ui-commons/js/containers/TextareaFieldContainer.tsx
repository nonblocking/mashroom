
import React, {PureComponent} from 'react';
import {injectIntl} from 'react-intl';
import {Field} from 'redux-form';
import TextareaField from '../components/TextareaField';

import type {WrappedFieldProps} from 'redux-form';
import type {IntlShape} from 'react-intl';

type OwnProps = {
    id: string;
    name: string;
    labelId: string;
    rows?: number;
    maxLength?: number;
    placeholder?: string;
}

type IntlProps = {
    intl: IntlShape
}

type Props = OwnProps & IntlProps;

class TextareaFieldContainer extends PureComponent<Props> {

    render() {
        return <Field name={this.props.name} component={(fieldProps: WrappedFieldProps) => <TextareaField fieldProps={fieldProps} {...this.props}/>}/>;
    }
}

export default injectIntl(TextareaFieldContainer);
