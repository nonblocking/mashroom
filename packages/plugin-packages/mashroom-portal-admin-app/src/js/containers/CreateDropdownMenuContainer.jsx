// @flow

import React from 'react';
import {connect} from 'react-redux';
import CreateDropdownMenu from '../components/CreateDropdownMenu';
import {setShowModal} from '@mashroom/mashroom-portal-ui-commons';
import {setSelectedPageNew, setSelectedSiteNew} from '../store/actions';

import type {ComponentType} from 'react';
import type {Dispatch, State} from '../../../type-definitions';

type OwnProps = {
}

type StateProps = {
}

type DispatchProps = {
    showModal: (name: string) => void,
    initConfigureSite: () => void,
    initConfigurePage: () => void
}

const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => ({
});

const mapDispatchToProps = (dispatch: Dispatch, ownProps: OwnProps): DispatchProps => ({
    showModal: (name: string) => { dispatch(setShowModal(name, true)); },
    initConfigureSite: () => { dispatch(setSelectedSiteNew()); },
    initConfigurePage: () => { dispatch(setSelectedPageNew()); }
});

export default (connect(mapStateToProps, mapDispatchToProps)(CreateDropdownMenu): ComponentType<OwnProps>);
