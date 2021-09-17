
import React, {PureComponent} from 'react';
import {FieldArray} from 'formik';
import RolesListComp from '../components/RolesList';

import type {FieldArrayRenderProps} from 'formik';

type Props = {
    name: string;
    addRoleRef?: (addRole: (role: string) => void) => void;
}

export default class RolesList extends PureComponent<Props> {

    render() {
        const {name, addRoleRef} = this.props;
        return (
            <FieldArray name={name} render={({form, insert, remove}: FieldArrayRenderProps) => {
                return (
                    <RolesListComp roles={form.values?.roles} addRoleRef={addRoleRef} addRole={insert} removeRole={remove} />
                );
            }}/>
        );
    }
}
