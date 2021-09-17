
import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import PageConfigureDialogComp from '../components/PageConfigureDialog';
import {DependencyContextConsumer} from '../DependencyContext';
import {
    setSelectedPageLoading,
    setSelectedPageLoadingError,
    setSelectedPageUpdatingError,
    setSelectedPageData,
    setSelectedPageRefData,
    setSelectedPagePermittedRoles
} from '../store/actions';

import type {
    MashroomAvailablePortalLayout,
    MashroomAvailablePortalTheme,
    MashroomPortalPage,
    MashroomPortalPageRef
} from '@mashroom/mashroom-portal/type-definitions';
import type {Dispatch, Languages, Pages, SelectedPage, State} from '../types';

type StateProps = {
    languages: Languages;
    pages: Pages;
    availableThemes: Array<MashroomAvailablePortalTheme>;
    availableLayouts: Array<MashroomAvailablePortalLayout>;
    selectedPage: SelectedPage | undefined | null;
}

type DispatchProps = {
    setLoading: (loading: boolean) => void;
    setErrorLoading: (error: boolean) => void;
    setErrorUpdating: (error: boolean) => void;
    setPage: (page: MashroomPortalPage) => void;
    setPageRef: (ref: MashroomPortalPageRef | undefined | null) => void;
    setPermittedRoles: (roles: Array<string> | undefined | null) => void;
}

type Props = StateProps & DispatchProps;

class PageConfigureDialog extends PureComponent<Props> {

    render() {
        return (
            <DependencyContextConsumer>
                {(deps) => (
                    <PageConfigureDialogComp
                        dataLoadingService={deps.dataLoadingService}
                        portalAdminService={deps.portalAdminService}
                        portalSiteService={deps.portalSiteService}
                        {...this.props}
                    />
                )}
            </DependencyContextConsumer>
        );
    }
}

const mapStateToProps = (state: State): StateProps => ({
    languages: state.languages,
    pages: state.pages,
    availableThemes: state.availableThemes,
    availableLayouts: state.availableLayouts,
    selectedPage: state.selectedPage
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
    setLoading: (loading) => { dispatch(setSelectedPageLoading(loading)); },
    setErrorLoading: (error) => { dispatch(setSelectedPageLoadingError(error)); },
    setErrorUpdating: (error) => { dispatch(setSelectedPageUpdatingError(error)); },
    setPage: (page) => { dispatch(setSelectedPageData(page)); },
    setPageRef: (pageRef) => { dispatch(setSelectedPageRefData(pageRef)); },
    setPermittedRoles: (roles) => { dispatch(setSelectedPagePermittedRoles(roles)); }
});

export default connect(mapStateToProps, mapDispatchToProps)(PageConfigureDialog);
