// @flow

import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import RoleInput from '../components/RoleInput';
import {DependencyContextConsumer} from '../DependencyContext';
import {setExistingRoles} from '../store/actions';

import type {ComponentType} from 'react';
import type {Dispatch, State} from '../../../type-definitions';

type OwnProps = {
    onRoleChange?: (role: ?string) => void,
    resetRef?: (() => void) => void,
}

type StateProps = {|
    existingRoles: Array<string>
|}

type DispatchProps = {|
    setExistingRoles: (Array<string>) => void
|}

class RoleInputContainer extends PureComponent<OwnProps & StateProps & DispatchProps> {

    render() {
        return (
            <DependencyContextConsumer>
                {(deps) => <RoleInput portalAdminService={deps.portalAdminService} {...this.props}/>}
            </DependencyContextConsumer>
        );
    }
}

const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => ({
    existingRoles: state.existingRoles
});

const mapDispatchToProps = (dispatch: Dispatch, ownProps: OwnProps): DispatchProps => ({
    setExistingRoles: (roles) => { dispatch(setExistingRoles(roles)); }
});

export default (connect(mapStateToProps, mapDispatchToProps)(RoleInputContainer): ComponentType<OwnProps>);
