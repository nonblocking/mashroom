// @flow

import React from 'react';
import {connect} from 'react-redux';
import Modal from '../components/Modal';
import {setShowModal} from '../store/actions';

import type {Node, ComponentType} from 'react';
import type {CommonState, Dispatch} from '../../../type-definitions';

type OwnProps = {
    name: string,
    titleId?: string,
    title?: string,
    closeRef?: (() => void) => void,
    children: Node,
    appWrapperClassName: string,
    className?: string,
    customHeader?: Node,
    minWidth?: number,
    minHeight?: number
}

type StateProps = {|
    show: boolean,
|}

type DispatchProps = {|
    onClose: () => void,
|}

const mapStateToProps = (state: CommonState, ownProps: OwnProps): StateProps => ({
    show: state.modals && state.modals[ownProps.name] && state.modals[ownProps.name].show,
});

const mapDispatchToProps = (dispatch: Dispatch, ownProps: OwnProps): DispatchProps => ({
    onClose: () => {
        dispatch(setShowModal(ownProps.name, false));
    },
});

export default (connect(mapStateToProps, mapDispatchToProps)(Modal): ComponentType<OwnProps>);
