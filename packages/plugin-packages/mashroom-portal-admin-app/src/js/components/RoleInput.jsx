// @flow

import React, {PureComponent} from 'react';
import {
    AutocompleteFieldContainer,
    AutocompleteStringArraySuggestionHandler
} from '@mashroom/mashroom-portal-ui-commons';

import type {MashroomPortalAdminService} from '@mashroom/mashroom-portal/type-definitions';

type Props = {
    portalAdminService: MashroomPortalAdminService,
    existingRoles: Array<string>,
    onRoleChange?: (role: ?string) => void,
    setExistingRoles: (Array<string>) => void
};

export default class RoleInput extends PureComponent<Props> {

    componentDidMount() {
        this.props.portalAdminService.getExistingRoles().then(
            (existingRoleDefs) => {
                const existingRoles = existingRoleDefs.map((r) => r.id);
                this.props.setExistingRoles(existingRoles);
            },
            (error) => {
                console.error('Fetching existing roles failed', error);
            }
        )
    }

    onRoleChange(role: ?string) {
        if (this.props.onRoleChange) {
            this.props.onRoleChange(role);
        }
    }

    render() {
        const suggestionHandler = new AutocompleteStringArraySuggestionHandler(this.props.existingRoles);

        return (
            <div className='role-input'>
                <AutocompleteFieldContainer
                    id='roleToAdd'
                    name='roleToAdd'
                    labelId='addRole'
                    onValueChange={this.onRoleChange.bind(this)}
                    minCharactersForSuggestions={2}
                    mustSelectSuggestion={false}
                    suggestionHandler={suggestionHandler}/>
            </div>

        );
    }

}
