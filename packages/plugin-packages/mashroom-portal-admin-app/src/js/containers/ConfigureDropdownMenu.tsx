
import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {setShowModal} from '@mashroom/mashroom-portal-ui-commons';
import {DependencyContextConsumer} from '../DependencyContext';
import ConfigureDropdownMenuComp from '../components/ConfigureDropdownMenu';
import {setSelectedPage, setSelectedSite} from '../store/actions';

import type {Dispatch, State} from '../types';

type DispatchProps = {
    showModal: (name: string) => void;
    initConfigureSite: (siteId: string) => void;
    initConfigurePage: (pageId: string) => void;
}

type Props = DispatchProps;

class ConfigureDropdownMenu extends PureComponent<Props> {

    render() {
        return (
            <DependencyContextConsumer>
                {(deps) => <ConfigureDropdownMenuComp portalAdminService={deps.portalAdminService} {...this.props}/>}
            </DependencyContextConsumer>
        );
    }
}

const mapStateToProps = (state: State) => ({
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
    showModal: (name: string) => { dispatch(setShowModal(name, true)); },
    initConfigureSite: (siteId) => { dispatch(setSelectedSite(siteId)); },
    initConfigurePage: (pageId) => { dispatch(setSelectedPage(pageId)); }
});

export default connect(mapStateToProps, mapDispatchToProps)(ConfigureDropdownMenu);
