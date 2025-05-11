
import React from 'react';
import {FieldArray} from 'formik';
import RolesListComp from './RolesList';

import type {FieldArrayRenderProps} from 'formik';

type Props = {
    name: string;
    addRoleRef?: (addRole: (role: string) => void) => void;
}

export default ({name, addRoleRef}: Props) => {
    return (
        <FieldArray name={name} render={({form, insert, remove}: FieldArrayRenderProps) => {
            return (
                <RolesListComp roles={form.values?.roles} addRoleRef={addRoleRef} addRole={insert} removeRole={remove} />
            );
        }}/>
    );
};
