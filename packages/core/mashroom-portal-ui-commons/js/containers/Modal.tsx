
import React from 'react';
import {connect} from 'react-redux';
import ModalComp from '../components/Modal';
import {setShowModal} from '../store/actions';

import type {ReactNode} from 'react';
import type {CommonState, Dispatch} from '../../type-definitions';

type OwnProps = {
    name: string;
    titleId?: string;
    title?: string;
    closeRef?: (close: () => void) => void;
    children: ReactNode;
    appWrapperClassName: string;
    className?: string;
    customHeader?: ReactNode;
    minWidth?: number;
    minHeight?: number;
}

const mapStateToProps = (state: CommonState, ownProps: OwnProps) => ({
    show: state.modals && state.modals[ownProps.name] && state.modals[ownProps.name].show,
});

const mapDispatchToProps = (dispatch: Dispatch, ownProps: OwnProps) => ({
    onClose: () => {
        dispatch(setShowModal(ownProps.name, false));
    },
});

export default connect(mapStateToProps, mapDispatchToProps)(ModalComp);
