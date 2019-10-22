// @flow

import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {DependencyContextConsumer} from '../DependencyContext';
import {setSelectedPageUpdatingError} from '../store/actions';
import PageDeleteDialog from '../components/PageDeleteDialog';

import type {ComponentType} from 'react';
import type {Dispatch, Pages, SelectedPage, State} from '../../../type-definitions';

type OwnProps = {
}

type StateProps = {|
    pages: Pages,
    selectedPage: ?SelectedPage
|}

type DispatchProps = {|
    setErrorUpdating: (boolean) => void
|}

class PageDeleteDialogContainer extends PureComponent<OwnProps & StateProps & DispatchProps> {

    render() {
        return (
            <DependencyContextConsumer>
                {(deps) => <PageDeleteDialog portalAdminService={deps.portalAdminService} {...this.props}/>}
            </DependencyContextConsumer>
        );
    }
}

const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => ({
    pages: state.pages,
    selectedPage: state.selectedPage
});

const mapDispatchToProps = (dispatch: Dispatch, ownProps: OwnProps): DispatchProps => ({
    setErrorUpdating: (error) => { dispatch(setSelectedPageUpdatingError(error)); }
});

export default (connect(mapStateToProps, mapDispatchToProps)(PageDeleteDialogContainer): ComponentType<OwnProps>);
