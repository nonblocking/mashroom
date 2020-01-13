// @flow

import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {Field} from 'redux-form';

import type {FieldProps} from 'redux-form';
import type {IntlShape} from 'react-intl';
import I18NStringField from '../components/I18NStringField';

import type {Node, ComponentType} from 'react';
import type {Languages, State} from '../../../type-definitions';

type OwnProps = {|
    id: string,
    labelId: string,
    name: string
|}

type StateProps = {|
    languages: Languages,
|}

type Props = OwnProps & StateProps;

class I18NStringFieldContainer extends PureComponent<Props> {

    render() {
        return <Field name={this.props.name} component={(fieldProps: FieldProps): Node => <I18NStringField fieldProps={fieldProps} {...this.props}/>}/>;
    }
}

const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => ({
    languages: state.languages,
});

export default (connect(mapStateToProps)(I18NStringFieldContainer): ComponentType<OwnProps>);
