// @flow

import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {setShowModal} from '@mashroom/mashroom-portal-ui-commons';
import PagesDropdownMenu from '../components/PagesDropdownMenu';
import {DependencyContextConsumer} from '../DependencyContext';
import {setSelectedPage} from '../store/actions';

import type {ComponentType} from 'react';
import type {Dispatch, Pages, State} from '../../../type-definitions';

type OwnProps = {
}

type StateProps = {|
    pages: Pages,
|}

type DispatchProps = {|
    showModal: (name: string) => void,
    initConfigurePage: (pageId: string) => void
|}

class PagesDropdownMenuContainer extends PureComponent<OwnProps & StateProps & DispatchProps> {

    render() {
        return (
            <DependencyContextConsumer>
                {(deps) => <PagesDropdownMenu portalAdminService={deps.portalAdminService} dataLoadingService={deps.dataLoadingService} portalSiteService={deps.portalSiteService} {...this.props}/>}
            </DependencyContextConsumer>
        );
    }
}

const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => ({
    pages: state.pages
});

const mapDispatchToProps = (dispatch: Dispatch, ownProps: OwnProps): DispatchProps => ({
    showModal: (name: string) => { dispatch(setShowModal(name, true)); },
    initConfigurePage: (pageId) => { dispatch(setSelectedPage(pageId)); }
});

export default (connect(mapStateToProps, mapDispatchToProps)(PagesDropdownMenuContainer): ComponentType<OwnProps>);
