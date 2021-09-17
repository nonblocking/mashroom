
import React, {PureComponent} from 'react';
import {TableResponsive} from '@mashroom/mashroom-portal-ui-commons';

import type {ReactNode} from 'react';

type Props = {
    roles: Array<string> | undefined;
    removeRole: (index: number) => void;
    addRole: (index: number, role: string) => void;
    addRoleRef?: (addRole: (role: string) => void) => void;
};

export default class RolesList extends PureComponent<Props> {

    constructor(props: Props) {
        super(props);
        if (this.props.addRoleRef) {
            this.props.addRoleRef(this.onAddRole.bind(this));
        }
    }

    onAddRole(role: string): void {
        const {roles, addRole} = this.props;
        if (!roles || roles.indexOf(role) === -1) {
            addRole(0, role);
        }

    }

    onRemoveRole(index: number): void {
        const {removeRole} = this.props;
        removeRole(index);
    }

    render(): ReactNode {
        const {roles} = this.props;
        let rows: Array<ReactNode> = [];

        if (!roles || roles.length === 0) {
            return null;
        }

        rows = roles.map((role, index) => (
            <tr key={role} className='field-list-item'>
                <td className='role'>
                    {role}
                </td>
                <td className='role-remove' onClick={this.onRemoveRole.bind(this, index)}/>
            </tr>
        ));

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

