
import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import RoleInput from '../components/RoleInput';
import {DependencyContextConsumer} from '../DependencyContext';
import {setExistingRoles} from '../store/actions';

import type {Dispatch, State} from '../types';

type OwnProps = {
    onRoleChange?: (role: string | undefined | null) => void;
    onRoleSelected?: (role: string) => void;
    resetRef?: (reset: () => void) => void;
}

type StateProps = {
    existingRoles: Array<string>;
}

type DispatchProps = {
    setExistingRoles: (roles: Array<string>) => void;
}

type Props = OwnProps & StateProps & DispatchProps;

class RoleInputContainer extends PureComponent<Props> {

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

export default connect(mapStateToProps, mapDispatchToProps)(RoleInputContainer);
