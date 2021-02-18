
import React, {PureComponent} from 'react';
import {TableResponsive} from '@mashroom/mashroom-portal-ui-commons';
import {Field} from 'redux-form';

import type {ReactNode} from 'react';
import type {WrappedFieldArrayProps, WrappedFieldProps} from 'redux-form';

type Props = {
    fieldArrayProps: WrappedFieldArrayProps;
    addRoleRef?: (addRole: (role: string) => void) => void;
};

export default class RolesList extends PureComponent<Props> {

    constructor(props: Props) {
        super(props);
        if (this.props.addRoleRef) {
            this.props.addRoleRef((role) => this.onAddRole(props.fieldArrayProps, role));
        }
    }

    onAddRole(fieldArray: WrappedFieldArrayProps, role: string) {
        const existingFields = fieldArray.fields.getAll() || [];
        if (existingFields.indexOf(role) === -1) {
            fieldArray.fields.insert(0, role);
        }
    }

    onRemoveRole(fieldArray: WrappedFieldArrayProps, index: number) {
        fieldArray.fields.remove(index);
    }

    render() {
        let rows: Array<ReactNode> = [];
        if (this.props.fieldArrayProps.fields) {
            rows = this.props.fieldArrayProps.fields.map((role, index) => (
                <tr key={role} className='field-list-item'>
                    <td className='role'>
                        <Field name={role} component={(fieldProps: WrappedFieldProps) => fieldProps.input.value}/>
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

