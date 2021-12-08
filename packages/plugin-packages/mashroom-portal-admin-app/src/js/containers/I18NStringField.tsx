
import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {Field} from 'formik';

import type {FieldProps} from 'formik';
import I18NStringFieldComp from '../components/I18NStringField';

import type {Languages, State} from '../types';

type OwnProps = {
    id: string;
    labelId: string;
    name: string;
}

type StateProps = {
    languages: Languages;
}

type Props = OwnProps & StateProps;

class I18NStringField extends PureComponent<Props> {

    render() {
        const {name} = this.props;
        return (
            <Field name={name}>
                {(fieldProps: FieldProps) => <I18NStringFieldComp fieldProps={fieldProps} {...this.props}/>}
            </Field>
        );
    }
}

const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => ({
    languages: state.languages,
});

export default connect(mapStateToProps)(I18NStringField);
