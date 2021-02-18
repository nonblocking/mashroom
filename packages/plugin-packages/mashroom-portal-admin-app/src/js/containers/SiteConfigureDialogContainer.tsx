
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

import type {
    MashroomAvailablePortalLayout,
    MashroomAvailablePortalTheme,
    MashroomPortalSite
} from '@mashroom/mashroom-portal/type-definitions';
import type {Dispatch, Languages, SelectedSite, Sites, State} from '../types';

type StateProps = {
    sites: Sites;
    selectedSite: SelectedSite | undefined | null;
    languages: Languages;
    availableThemes: Array<MashroomAvailablePortalTheme>;
    availableLayouts: Array<MashroomAvailablePortalLayout>;
}

type DispatchProps = {
    setLoading: (loading: boolean) => void;
    setErrorLoading: (error: boolean) => void;
    setErrorUpdating: (error: boolean) => void;
    setSite: (site: MashroomPortalSite) => void;
    setPermittedRoles: (roles: Array<string> | undefined | null) => void;
}

type Props = StateProps & DispatchProps;

class PageConfigureDialogContainer extends PureComponent<Props> {

    render() {
        return (
            <DependencyContextConsumer>
                {(deps) => <SiteConfigureDialog dataLoadingService={deps.dataLoadingService} portalAdminService={deps.portalAdminService} portalSiteService={deps.portalSiteService} {...this.props}/>}
            </DependencyContextConsumer>
        );
    }
}

const mapStateToProps = (state: State): StateProps => ({
    sites: state.sites,
    selectedSite: state.selectedSite,
    languages: state.languages,
    availableThemes: state.availableThemes,
    availableLayouts: state.availableLayouts,
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
    setLoading: (loading) => { dispatch(setSelectedSiteLoading(loading)); },
    setErrorLoading: (error) => { dispatch(setSelectedSiteLoadingError(error)); },
    setErrorUpdating: (error) => { dispatch(setSelectedSiteUpdatingError(error)); },
    setSite: (site) => { dispatch(setSelectedSiteData(site)); },
    setPermittedRoles: (roles) => { dispatch(setSelectedSitePermittedRoles(roles)); }
});

export default connect(mapStateToProps, mapDispatchToProps)(PageConfigureDialogContainer);
