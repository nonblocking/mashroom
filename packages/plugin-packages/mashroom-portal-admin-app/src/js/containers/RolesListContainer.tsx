
import React, {PureComponent} from 'react';
import {FieldArray} from 'redux-form';
import RolesList from '../components/RolesList';

import type {WrappedFieldArrayProps} from 'redux-form';

type Props = {
    name: string;
    addRoleRef?: (addRole: (role: string) => void) => void;
}

export default class RolesListContainer extends PureComponent<Props> {

    render() {
        return <FieldArray name={this.props.name} props={{}} component={
            (fieldArrayProps: WrappedFieldArrayProps) => <RolesList fieldArrayProps={fieldArrayProps} {...this.props}/>
        }/>;
    }
}
