// @flow

import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import SiteConfigureDialog from '../components/SiteConfigureDialog';
import {DependencyContextConsumer} from '../DependencyContext';
import {
    setSelectedSiteLoading,
    setSelectedSiteLoadingError,
    setSelectedSiteUpdatingError,
    setSelectedSiteData,
    setSelectedSitePermittedRoles
} from '../store/actions';

import type {ComponentType} from 'react';
import type {
    MashroomAvailablePortalLayout,
    MashroomAvailablePortalTheme,
    MashroomPortalSite
} from '@mashroom/mashroom-portal/type-definitions';
import type {Dispatch, Languages, SelectedSite, State} from '../../../type-definitions';

type OwnProps = {|
|}

type StateProps = {|
    selectedSite: ?SelectedSite,
    languages: Languages,
    availableThemes: Array<MashroomAvailablePortalTheme>,
    availableLayouts: Array<MashroomAvailablePortalLayout>,
|}

type DispatchProps = {|
    setLoading: (boolean) => void,
    setErrorLoading: (boolean) => void,
    setErrorUpdating: (boolean) => void,
    setSite: (MashroomPortalSite) => void,
    setPermittedRoles: (?Array<string>) => void
|}

type Props = OwnProps & StateProps & DispatchProps;

class PageConfigureDialogContainer extends PureComponent<Props> {

    render() {
        return (
            <DependencyContextConsumer>
                {(deps) => <SiteConfigureDialog dataLoadingService={deps.dataLoadingService} portalAdminService={deps.portalAdminService} portalSiteService={deps.portalSiteService} {...this.props}/>}
            </DependencyContextConsumer>
        );
    }
}

const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => ({
    selectedSite: state.selectedSite,
    languages: state.languages,
    availableThemes: state.availableThemes,
    availableLayouts: state.availableLayouts,
});

const mapDispatchToProps = (dispatch: Dispatch, ownProps: OwnProps): DispatchProps => ({
    setLoading: (loading) => { dispatch(setSelectedSiteLoading(loading)); },
    setErrorLoading: (error) => { dispatch(setSelectedSiteLoadingError(error)); },
    setErrorUpdating: (error) => { dispatch(setSelectedSiteUpdatingError(error)); },
    setSite: (site) => { dispatch(setSelectedSiteData(site)); },
    setPermittedRoles: (roles) => { dispatch(setSelectedSitePermittedRoles(roles)); }
});

export default (connect(mapStateToProps, mapDispatchToProps)(PageConfigureDialogContainer): ComponentType<OwnProps>);
