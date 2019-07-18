// @flow

import React from 'react';
import {connect} from 'react-redux';
import TabDialog from '../components/TabDialog';
import {setActiveTab} from '../store/actions';

import type {Node, ComponentType} from 'react';
import type {CommonState, Dispatch} from '../../../type-definitions';

type OwnProps = {
    name: string,
    tabs: Array<{
        name: string,
        titleId: string,
        content: Node
    }>,
    className?: string
}

type StateProps = {
    activeTab?: string,
}

type DispatchProps = {
    setActiveTab: (name: string) => void,
}

const mapStateToProps = (state: CommonState, ownProps: OwnProps): StateProps => ({
    activeTab: state.tabDialogs && state.tabDialogs[ownProps.name] && state.tabDialogs[ownProps.name].active,
});

const mapDispatchToProps = (dispatch: Dispatch, ownProps: OwnProps): DispatchProps => ({
    setActiveTab: (name: string) => {
        dispatch(setActiveTab(ownProps.name, name));
    },
});

export default (connect(mapStateToProps, mapDispatchToProps)(TabDialog): ComponentType<OwnProps>);
