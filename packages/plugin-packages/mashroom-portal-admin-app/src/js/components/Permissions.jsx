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
    inputReset: () => void;
    boundOnResetRef: () => void;
    boundOnRoleChange: (?string) => void;
    boundOnRoleSelected: (?string) => void;

    constructor() {
        super();
        this.boundOnRoleChange = this.onRoleChange.bind(this);
        this.boundOnRoleSelected = this.onRoleSelected.bind(this);
        this.boundOnResetRef = this.onResetRef.bind(this);
        this.state = {
            enteredRole: null
        }
    }

    onRoleChange(enteredRole: ?string) {
        this.setState({
            enteredRole
        });
    }

    onRoleSelected(role: string) {
        this.setState({
            enteredRole: role,
        }, () => {
            this.onAddRole();
        });
    }

    onAddRole() {
        if (this.state.enteredRole) {
            this.addRole(this.state.enteredRole);
            this.inputReset();
        }
    }

    onResetRef(resetRef: () => void) {
        this.inputReset = resetRef;
    }

    render() {
        return (
            <div className='permissions'>
                <FormattedMessage id='restrictViewPermission'/>

                <div className='add-role-panel'>
                    <RoleInputContainer
                        onRoleChange={this.boundOnRoleChange}
                        onRoleSelected={this.boundOnRoleSelected}
                        resetRef={this.boundOnResetRef}
                    />
                    <Button id='addButton' labelId='add' onClick={this.onAddRole.bind(this)} disabled={!this.state.enteredRole}/>
                </div>

                <RolesListContainer name='roles' addRoleRef={(addRole) => { this.addRole = addRole }}/>
            </div>
        );
    }

}
