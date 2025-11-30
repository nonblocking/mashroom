import React, {useEffect, useCallback, useMemo, useContext} from 'react';
import {
    AutocompleteField,
    AutocompleteStringArraySuggestionHandler
} from '@mashroom/mashroom-portal-ui-commons';
import {DependencyContext} from '../DependencyContext';
import {setExistingRoles} from '../store/actions';
import useStore from '../store/useStore';

type Props = {
    onRoleChange?: (role: string | undefined | null) => void;
    onRoleSelected?: (role: string) => void;
    resetRef?: (reset: () => void) => void;
};

export default ({ onRoleChange, onRoleSelected, resetRef }: Props) => {
    const existingRoles = useStore((state) => state.existingRoles);
    const dispatch = useStore((state) => state.dispatch);
    const {portalAdminService} = useContext(DependencyContext);
    const setRoles = (roles: Array<string>) => dispatch(setExistingRoles(roles));

    useEffect(() => {
        const fetchExistingRoles = async () => {
            if (existingRoles.length === 0) {
                try {
                    const existingRoleDefs = await portalAdminService.getExistingRoles();
                    const roles = existingRoleDefs.map((r) => r.id);
                    setRoles(roles);
                } catch (error) {
                    console.error('Fetching existing roles failed', error);
                }
            }
        };

        fetchExistingRoles();
    }, []);


    const handleRoleChange = useCallback((role: string | undefined | null) => {
        if (onRoleChange) {
            onRoleChange(role);
        }
    }, [onRoleChange]);

    const handleRoleSelected = useCallback((role: string) => {
        if (onRoleSelected) {
            onRoleSelected(role);
        }
    }, [onRoleSelected]);

    const suggestionHandler = useMemo(() => {
        return new AutocompleteStringArraySuggestionHandler(existingRoles);
    }, [existingRoles]);

    return (
        <div className='role-input'>
            <AutocompleteField
                id='roleToAdd'
                name='roleToAdd'
                labelId='addRole'
                onValueChange={handleRoleChange}
                onSuggestionSelect={handleRoleSelected}
                minCharactersForSuggestions={2}
                mustSelectSuggestion={false}
                suggestionHandler={suggestionHandler}
                resetRef={resetRef}
            />
        </div>
    );
};
