// @flow

import React, {PureComponent} from 'react';
import {FieldArray} from 'redux-form';
import RolesList from '../components/RolesList';

import type {FieldArrayProps} from 'redux-form';
import type {Node} from 'react';

type Props = {|
    name: string,
    addRoleRef?: ((role: string) => void) => void
|}

export default class RolesListContainer extends PureComponent<Props> {

    render() {
        return <FieldArray name={this.props.name} component={(fieldArrayProps: FieldArrayProps): Node => <RolesList fieldArrayProps={fieldArrayProps} {...this.props}/>}/>;
    }
}
