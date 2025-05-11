import React, { useCallback, useEffect } from 'react';
import { TableResponsive } from '@mashroom/mashroom-portal-ui-commons';

import type { ReactNode } from 'react';

type Props = {
    roles: Array<string> | undefined;
    removeRole: (index: number) => void;
    addRole: (index: number, role: string) => void;
    addRoleRef?: (addRoleToList: (role: string) => void) => void;
};

export default ({ roles, removeRole, addRole, addRoleRef }: Props) => {

    const handleAddRoleToList = useCallback((role: string) => {
        if (!roles || !roles.includes(role)) {
            // Add to the beginning of the list (index 0) as per original logic
            addRole(0, role);
        }
    }, [roles, addRole]);

    useEffect(() => {
        if (addRoleRef) {
            addRoleRef(handleAddRoleToList);
        }
    }, [addRoleRef, handleAddRoleToList]);

    const handleRemoveRole = useCallback((index: number) => {
        removeRole(index);
    }, [removeRole]);

    if (!roles || roles.length === 0) {
        return null;
    }

    const rows: Array<ReactNode> = roles.map((role, index) => (
        <tr key={`${role}-${index}`} className='field-list-item'>
            <td className='role'>
                {role}
            </td>
            <td
                className='role-remove'
                onClick={() => handleRemoveRole(index)}
                role="button"
                tabIndex={0}
            />
        </tr>
    ));

    return (
        <div className='roles-list'>
            <TableResponsive striped>
                <tbody>
                    {rows}
                </tbody>
            </TableResponsive>
        </div>
    );
};
