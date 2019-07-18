// @flow

import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';
import {Button} from '@mashroom/mashroom-portal-ui-commons';
import RoleInputContainer from '../containers/RoleInputContainer';
import RolesListContainer from '../containers/RolesListContainer';

type Props = {
};

type State = {
    enteredRole: ?string
}

export default class Permissions extends PureComponent<Props, State> {

    addRole: (role: string) => void;
    onRoleChange: (?string) => void;

    constructor() {
        super();
        this.onRoleChange = this.onRoleChange.bind(this);
        this.state = {
            enteredRole: null
        }
    }

    onRoleChange(enteredRole: ?string) {
        this.setState({
            enteredRole
        });
    }

    onAddRole() {
        if (this.state.enteredRole) {
            this.addRole(this.state.enteredRole);
        }
    }

    render() {
        return (
            <div className='permissions'>
                <FormattedMessage id='restrictViewPermission'/>

                <div className='add-role-panel'>
                    <RoleInputContainer onRoleChange={this.onRoleChange}/>
                    <Button id='addButton' labelId='add' onClick={this.onAddRole.bind(this)} disabled={!this.state.enteredRole}/>
                </div>

                <RolesListContainer name='roles' addRoleRef={(addRole) => { this.addRole = addRole }}/>
            </div>
        );
    }

}
