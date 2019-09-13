// @flow

import React, {PureComponent} from 'react';
import {TableResponsive} from '@mashroom/mashroom-portal-ui-commons';
import {Field} from 'redux-form';

import type {FieldArrayProps} from 'redux-form';

type Props = {
    fieldArrayProps: FieldArrayProps,
    addRoleRef?: ((role: string) => void) => void
};

export default class RolesList extends PureComponent<Props> {

    constructor(props: Props) {
        super(props);
        if (this.props.addRoleRef) {
            this.props.addRoleRef((role) => this.onAddRole(props.fieldArrayProps, role));
        }
    }

    onAddRole(fieldArray: FieldArrayProps, role: string) {
        fieldArray.fields.insert(0, role);
    }

    onRemoveRole(fieldArray: FieldArrayProps, index: number) {
        fieldArray.fields.remove(index);
    }

    render() {
        let rows = [];
        if (this.props.fieldArrayProps.fields) {
            rows = this.props.fieldArrayProps.fields.map((role, index) => (
                <tr key={role} className='field-list-item'>
                    <td className='role'>
                        <Field name={role} component={(fieldProps) => fieldProps.input.value}/>
                    </td>
                    <td className='role-remove' onClick={this.onRemoveRole.bind(this, this.props.fieldArrayProps, index)}/>
                </tr>
            ));
        }

        if (rows.length === 0) {
            return null;
        }

        return (
            <div className='roles-list'>
                <TableResponsive>
                    <tbody>
                        {rows}
                    </tbody>
                </TableResponsive>
            </div>
        )
    }
}

