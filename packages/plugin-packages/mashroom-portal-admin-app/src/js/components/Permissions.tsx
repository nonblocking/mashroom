import React, { useState, useCallback, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from '@mashroom/mashroom-portal-ui-commons';
import RoleInputContainer from './RoleInput';
import RolesListField from './RolesListField';

export default () => {
    const [enteredRole, setEnteredRole] = useState<string | undefined | null>(null);
    const addRoleToListApi = useRef<((role: string) => void) | undefined>(undefined);
    const resetRoleInputApi = useRef<(() => void) | undefined>(undefined);

    const handleRoleInputChange = useCallback((currentInput: string | undefined | null) => {
        setEnteredRole(currentInput);
    }, []);

    const handleRoleSelected = useCallback((selectedRole: string) => {
        if (addRoleToListApi.current) {
            addRoleToListApi.current(selectedRole); // Add the role to the list
        }
        if (resetRoleInputApi.current) {
            resetRoleInputApi.current();
        }
        setEnteredRole(null);
    }, []);

    const handleAddRoleFromButton = useCallback(() => {
        if (enteredRole) {
            if (addRoleToListApi.current) {
                addRoleToListApi.current(enteredRole);
            }
            if (resetRoleInputApi.current) {
                resetRoleInputApi.current();
            }
            // Explicitly set enteredRole to null for the same reasons as above.
            setEnteredRole(null);
        }
    }, [enteredRole]);

    const captureInputResetApi = useCallback((resetFn: () => void) => {
        resetRoleInputApi.current = resetFn;
    }, []);

    const captureAddRoleApi = useCallback((addFn: (role: string) => void) => {
        addRoleToListApi.current = addFn;
    }, []);

    return (
        <div className='permissions'>
            <FormattedMessage id='restrictViewPermission' />
            <div className='add-role-panel'>
                <RoleInputContainer
                    onRoleChange={handleRoleInputChange}
                    onRoleSelected={handleRoleSelected}
                    resetRef={captureInputResetApi}
                />
                <Button
                    id='addButton'
                    labelId='add'
                    onClick={handleAddRoleFromButton}
                    disabled={!enteredRole}
                />
            </div>
            <RolesListField
                name='roles'
                addRoleRef={captureAddRoleApi}
            />
        </div>
    );
};
