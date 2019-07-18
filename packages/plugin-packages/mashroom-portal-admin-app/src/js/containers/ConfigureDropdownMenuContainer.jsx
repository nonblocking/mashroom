// @flow

import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {DependencyContextConsumer} from '../DependencyContext';
import ConfigureDropdownMenu from '../components/ConfigureDropdownMenu';
import {setShowModal} from '@mashroom/mashroom-portal-ui-commons';
import {setSelectedPage, setSelectedSite} from '../store/actions';

import type {ComponentType} from 'react';
import type {Dispatch, State} from '../../../type-definitions';

type OwnProps = {
}

type StateProps = {
}

type DispatchProps = {
    showModal: (name: string) => void,
    initConfigureSite: (siteId: string) => void,
    initConfigurePage: (pageId: string) => void
}

class ConfigureDropdownMenuContainer extends PureComponent<OwnProps & StateProps & DispatchProps> {

    render() {
        return (
            <DependencyContextConsumer>
                {(deps) => <ConfigureDropdownMenu portalAdminService={deps.portalAdminService} {...this.props}/>}
            </DependencyContextConsumer>
        );
    }
}

const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => ({
});

const mapDispatchToProps = (dispatch: Dispatch, ownProps: OwnProps): DispatchProps => ({
    showModal: (name: string) => { dispatch(setShowModal(name, true)); },
    initConfigureSite: (siteId) => { dispatch(setSelectedSite(siteId)); },
    initConfigurePage: (pageId) => { dispatch(setSelectedPage(pageId)); }
});

export default (connect(mapStateToProps, mapDispatchToProps)(ConfigureDropdownMenuContainer): ComponentType<OwnProps>);
