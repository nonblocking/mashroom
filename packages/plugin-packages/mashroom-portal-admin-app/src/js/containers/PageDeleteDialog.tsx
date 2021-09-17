
import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {DependencyContextConsumer} from '../DependencyContext';
import {setSelectedPageUpdatingError} from '../store/actions';
import PageDeleteDialogComp from '../components/PageDeleteDialog';

import type {Dispatch, Pages, SelectedPage, State} from '../types';

type StateProps = {
    pages: Pages;
    selectedPage: SelectedPage | undefined | null;
}

type DispatchProps = {
    setErrorUpdating: (error: boolean) => void;
}

type Props = StateProps & DispatchProps;

class PageDeleteDialog extends PureComponent<Props> {

    render() {
        return (
            <DependencyContextConsumer>
                {(deps) => (
                    <PageDeleteDialogComp
                        portalAdminService={deps.portalAdminService}
                        {...this.props}
                    />
                )}
            </DependencyContextConsumer>
        );
    }
}

const mapStateToProps = (state: State): StateProps => ({
    pages: state.pages,
    selectedPage: state.selectedPage
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
    setErrorUpdating: (error) => { dispatch(setSelectedPageUpdatingError(error)); }
});

export default connect(mapStateToProps, mapDispatchToProps)(PageDeleteDialog);
