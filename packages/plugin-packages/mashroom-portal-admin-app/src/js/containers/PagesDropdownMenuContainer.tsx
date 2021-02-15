
import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {setShowModal} from '@mashroom/mashroom-portal-ui-commons';
import PagesDropdownMenu from '../components/PagesDropdownMenu';
import {DependencyContextConsumer} from '../DependencyContext';
import {setSelectedPage} from '../store/actions';

import type {Dispatch, Pages, State} from '../types';

type StateProps = {
    pages: Pages;
}

type DispatchProps = {
    showModal: (name: string) => void;
    initConfigurePage: (pageId: string) => void;
}

type Props = StateProps & DispatchProps;

class PagesDropdownMenuContainer extends PureComponent<Props> {

    render() {
        return (
            <DependencyContextConsumer>
                {(deps) => <PagesDropdownMenu
                    portalAdminService={deps.portalAdminService}
                    dataLoadingService={deps.dataLoadingService}
                    portalSiteService={deps.portalSiteService}
                    {...this.props}
                />}
            </DependencyContextConsumer>
        );
    }
}

const mapStateToProps = (state: State): StateProps => ({
    pages: state.pages
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
    showModal: (name: string) => { dispatch(setShowModal(name, true)); },
    initConfigurePage: (pageId) => { dispatch(setSelectedPage(pageId)); }
});

export default connect(mapStateToProps, mapDispatchToProps)(PagesDropdownMenuContainer);
