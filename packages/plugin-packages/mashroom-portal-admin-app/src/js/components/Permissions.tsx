
import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';
import {Button} from '@mashroom/mashroom-portal-ui-commons';
import RoleInputContainer from '../containers/RoleInput';
import RolesList from '../containers/RolesList';

import type {ReactNode} from 'react';

type Props = Record<string, never>;

type State = {
    enteredRole: string | undefined | null;
}

export default class Permissions extends PureComponent<Props, State> {

    addRole: ((role: string) => void) | undefined;
    inputReset: (() => void) | undefined;
    boundOnResetRef: (resetRef: () => void) => void;
    boundOnRoleChange: (role: string | undefined | null) => void;
    boundOnRoleSelected: (role: string) => void;

    constructor(props: Props) {
        super(props);
        this.boundOnRoleChange = this.onRoleChange.bind(this);
        this.boundOnRoleSelected = this.onRoleSelected.bind(this);
        this.boundOnResetRef = this.onResetRef.bind(this);
        this.state = {
            enteredRole: null
        };
    }

    onRoleChange(enteredRole: string | undefined | null) {
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
        const {enteredRole} = this.state;
        if (enteredRole) {
            this.addRole?.(enteredRole);
            this.inputReset?.();
        }
    }

    onResetRef(resetRef: () => void) {
        this.inputReset = resetRef;
    }

    render() {
        const {enteredRole} = this.state;

        return (
            <div className='permissions'>
                <FormattedMessage id='restrictViewPermission'/>

                <div className='add-role-panel'>
                    <RoleInputContainer
                        onRoleChange={this.boundOnRoleChange}
                        onRoleSelected={this.boundOnRoleSelected}
                        resetRef={this.boundOnResetRef}
                    />
                    <Button id='addButton' labelId='add' onClick={this.onAddRole.bind(this)} disabled={!enteredRole}/>
                </div>

                <RolesList name='roles' addRoleRef={(addRole) => { this.addRole = addRole; }}/>
            </div>
        );
    }

}
