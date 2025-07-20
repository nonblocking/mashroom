import React, { useState, useCallback, useRef } from 'react';
import {useTranslation} from 'react-i18next';
import { Button } from '@mashroom/mashroom-portal-ui-commons';
import RoleInput from './RoleInput';
import RolesListField from './RolesListField';

export default () => {
    const {t} = useTranslation();
    const [enteredRole, setEnteredRole] = useState<string | undefined | null>(null);
    const addRoleToListRef = useRef<((role: string) => void) | undefined>(undefined);
    const resetRoleInputRef = useRef<(() => void) | undefined>(undefined);

    const handleRoleInputChange = useCallback((currentInput: string | undefined | null) => {
        setEnteredRole(currentInput);
    }, []);

    const handleAddRoleFromButton = useCallback(() => {
        if (enteredRole) {
            addRoleToListRef.current?.(enteredRole);
            resetRoleInputRef.current?.();
        }
    }, [enteredRole, addRoleToListRef.current, resetRoleInputRef.current]);

    const handleRoleSelected = useCallback((selectedRole: string) => {
        addRoleToListRef.current?.(selectedRole);
        setTimeout(() => {
            resetRoleInputRef.current?.();
        }, 100);
    }, [addRoleToListRef.current, resetRoleInputRef.current]);

    const captureInputReset = useCallback((cb: () => void) => {
        resetRoleInputRef.current = cb;
    }, []);

    const captureAddRole = useCallback((cb: (role: string) => void) => {
        addRoleToListRef.current = cb;
    }, []);

    return (
        <div className='permissions'>
            {t('restrictViewPermission')}
            <div className='add-role-panel'>
                <RoleInput
                    onRoleChange={handleRoleInputChange}
                    onRoleSelected={handleRoleSelected}
                    resetRef={captureInputReset}
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
                addRoleRef={captureAddRole}
            />
        </div>
    );
};
