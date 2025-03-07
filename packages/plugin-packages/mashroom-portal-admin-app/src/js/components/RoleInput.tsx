
import React, {PureComponent} from 'react';
import {
    AutocompleteField,
    AutocompleteStringArraySuggestionHandler
} from '@mashroom/mashroom-portal-ui-commons';

import type {MashroomPortalAdminService} from '@mashroom/mashroom-portal/type-definitions';

type Props = {
    portalAdminService: MashroomPortalAdminService;
    existingRoles: Array<string>;
    onRoleChange?: (role: string | undefined | null) => void;
    onRoleSelected?: (role: string) => void;
    setExistingRoles: (roles: Array<string>) => void;
    resetRef?: (reset: () => void) => void;
};

export default class RoleInput extends PureComponent<Props> {

    componentDidMount() {
        const {existingRoles, portalAdminService, setExistingRoles} = this.props;
        if (existingRoles.length === 0) {
            portalAdminService.getExistingRoles().then(
                (existingRoleDefs) => {
                    const existingRoles = existingRoleDefs.map((r) => r.id);
                    setExistingRoles(existingRoles);
                },
                (error) => {
                    console.error('Fetching existing roles failed', error);
                }
            );
        }
    }

    onRoleChange(role: string | undefined | null) {
        const {onRoleChange} = this.props;
        if (onRoleChange) {
            onRoleChange(role);
        }
    }

    onRoleSelected(role: string) {
        const {onRoleSelected} = this.props;
        if (onRoleSelected) {
            onRoleSelected(role);
        }
    }

    render() {
        const {existingRoles, resetRef} = this.props;
        return (
            <div className='role-input'>
                <AutocompleteField
                    id='roleToAdd'
                    name='roleToAdd'
                    labelId='addRole'
                    onValueChange={this.onRoleChange.bind(this)}
                    onSuggestionSelect={this.onRoleSelected.bind(this)}
                    minCharactersForSuggestions={2}
                    mustSelectSuggestion={false}
                    suggestionHandler={
                        new AutocompleteStringArraySuggestionHandler(existingRoles)
                    }
                    resetRef={resetRef} />
            </div>

        );
    }

}
