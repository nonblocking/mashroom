
import React, {PureComponent} from 'react';
import {
    AutocompleteFieldContainer,
    AutocompleteStringArraySuggestionHandler
} from '@mashroom/mashroom-portal-ui-commons';

import type {MashroomPortalAdminService} from '@mashroom/mashroom-portal/type-definitions';
import type {SuggestionHandler} from '@mashroom/mashroom-portal-ui-commons/type-definitions';

type Props = {
    portalAdminService: MashroomPortalAdminService;
    existingRoles: Array<string>;
    onRoleChange?: (role: string | undefined | null) => void;
    onRoleSelected?: (role: string) => void;
    setExistingRoles: (roles: Array<string>) => void;
    resetRef?: (reset: () => void) => void;
};

export default class RoleInput extends PureComponent<Props> {

    suggestionHandler: SuggestionHandler<any>;

    constructor(props: Props) {
        super(props);
        this.suggestionHandler = new AutocompleteStringArraySuggestionHandler(props.existingRoles);
    }

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

    onRoleChange(role: string | undefined | null) {
        if (this.props.onRoleChange) {
            this.props.onRoleChange(role);
        }
    }

    onRoleSelected(role: string) {
        if (this.props.onRoleSelected) {
            this.props.onRoleSelected(role);
        }
    }

    render() {
        return (
            <div className='role-input'>
                <AutocompleteFieldContainer
                    id='roleToAdd'
                    name='roleToAdd'
                    labelId='addRole'
                    onValueChange={this.onRoleChange.bind(this)}
                    onSuggestionSelect={this.onRoleSelected.bind(this)}
                    minCharactersForSuggestions={2}
                    mustSelectSuggestion={false}
                    suggestionHandler={this.suggestionHandler}
                    resetRef={this.props.resetRef} />
            </div>

        );
    }

}
