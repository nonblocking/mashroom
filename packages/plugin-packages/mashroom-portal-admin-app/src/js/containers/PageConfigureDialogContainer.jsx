// @flow

import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import PageConfigureDialog from '../components/PageConfigureDialog';
import {DependencyContextConsumer} from '../DependencyContext';
import {
    setSelectedPageLoading,
    setSelectedPageLoadingError,
    setSelectedPageUpdatingError,
    setSelectedPageData,
    setSelectedPageRefData,
    setSelectedPagePermittedRoles
} from '../store/actions';

import type {ComponentType} from 'react';
import type {
    MashroomAvailablePortalLayout,
    MashroomAvailablePortalTheme,
    MashroomPortalPage,
    MashroomPortalPageRef
} from '@mashroom/mashroom-portal/type-definitions';
import type {Dispatch, Languages, Pages, SelectedPage, State} from '../../../type-definitions';

type OwnProps = {|
|}

type StateProps = {|
    languages: Languages,
    pages: Pages,
    availableThemes: Array<MashroomAvailablePortalTheme>,
    availableLayouts: Array<MashroomAvailablePortalLayout>,
    selectedPage: ?SelectedPage
|}

type DispatchProps = {|
    setLoading: (boolean) => void,
    setErrorLoading: (boolean) => void,
    setErrorUpdating: (boolean) => void,
    setPage: (MashroomPortalPage) => void,
    setPageRef: (?MashroomPortalPageRef) => void,
    setPermittedRoles: (?Array<string>) => void
|}

type Props = OwnProps & StateProps & DispatchProps;

class PageConfigureDialogContainer extends PureComponent<Props> {

    render() {
        return (
            <DependencyContextConsumer>
                {(deps) => <PageConfigureDialog dataLoadingService={deps.dataLoadingService} portalAdminService={deps.portalAdminService} portalSiteService={deps.portalSiteService} {...this.props}/>}
            </DependencyContextConsumer>
        );
    }
}

const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => ({
    languages: state.languages,
    pages: state.pages,
    availableThemes: state.availableThemes,
    availableLayouts: state.availableLayouts,
    selectedPage: state.selectedPage
});

const mapDispatchToProps = (dispatch: Dispatch, ownProps: OwnProps): DispatchProps => ({
    setLoading: (loading) => { dispatch(setSelectedPageLoading(loading)); },
    setErrorLoading: (error) => { dispatch(setSelectedPageLoadingError(error)); },
    setErrorUpdating: (error) => { dispatch(setSelectedPageUpdatingError(error)); },
    setPage: (page) => { dispatch(setSelectedPageData(page)); },
    setPageRef: (pageRef) => { dispatch(setSelectedPageRefData(pageRef)); },
    setPermittedRoles: (roles) => { dispatch(setSelectedPagePermittedRoles(roles)); }
});

export default (connect(mapStateToProps, mapDispatchToProps)(PageConfigureDialogContainer): ComponentType<OwnProps>);
