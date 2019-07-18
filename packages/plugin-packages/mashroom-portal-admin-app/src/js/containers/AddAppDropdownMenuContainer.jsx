// @flow

import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {injectIntl} from 'react-intl';
import AddAppDropdownMenu from '../components/AddAppDropdownMenu';
import {DependencyContextConsumer} from '../DependencyContext';

import type {IntlShape} from 'react-intl';

import type {ComponentType} from 'react';
import type {Dispatch, State} from '../../../type-definitions';

type OwnProps = {
}

type StateProps = {
}

type DispatchProps = {
}

type IntlProps = {
    intl: IntlShape
}

class AddAppDropdownMenuContainer extends PureComponent<IntlProps & OwnProps & StateProps & DispatchProps> {

    render() {
        return (
            <DependencyContextConsumer>
                {(deps) => <AddAppDropdownMenu dataLoadingService={deps.dataLoadingService} portalAppManagementService={deps.portalAppManagementService} {...this.props}/>}
            </DependencyContextConsumer>
        );
    }
}

const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => ({
});

const mapDispatchToProps = (dispatch: Dispatch, ownProps: OwnProps): DispatchProps => ({

});

export default (connect(mapStateToProps, mapDispatchToProps)(injectIntl(AddAppDropdownMenuContainer)): ComponentType<OwnProps>);
