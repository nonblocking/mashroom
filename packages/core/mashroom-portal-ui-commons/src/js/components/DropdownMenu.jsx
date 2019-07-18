// @flow

import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';
import enhanceWithClickOutside from 'react-click-outside';

import type {Node} from 'react';

type Props = {
    className?: string,
    label?: string,
    labelId?: string,
    children: Node,
    onOpen?: () => void,
    onClose?: () => void,
    closeRef?: (() => void) => void,
};

type State = {
    open: boolean,
};

class DropdownMenu extends PureComponent<Props, State> {

    boundHandleEscapeKeyPress: (event: KeyboardEvent) => void;

    constructor() {
        super();
        this.boundHandleEscapeKeyPress = this.handleEscapeKeyPress.bind(this);
        this.state = {
            open: false,
        };
    }

    componentDidMount() {
        if (this.props.closeRef) {
            // $FlowFixMe
            this.props.closeRef(this.hideMenu.bind(this));
        }
    }

    openDropDown() {
        this.setState({
            open: true
        });
        document.addEventListener('keydown', this.boundHandleEscapeKeyPress);
    }

    closeDropDown() {
        document.removeEventListener('keydown', this.boundHandleEscapeKeyPress);
        this.setState({
            open: false
        });
    }

    handleClickOutside() {
       this.closeDropDown();
    }

    handleEscapeKeyPress(event: KeyboardEvent) {
        if (event.code === 'Escape') {
           this.closeDropDown();
        }
    }

    toggleMenu() {
        if (!this.state.open) {
            this.openDropDown();
            if (this.props.onOpen) {
                this.props.onOpen();
            }
        } else {
            this.closeDropDown();
        }
    }

    hideMenu() {
        this.setState({
            open: false,
        });

        if (this.props.onClose) {
            this.props.onClose();
        }
    }

    render() {
        return (
            <div className={`mashroom-portal-ui-dropdown-menu ${this.props.className || ''}`}>
                <div className='dropdown-menu-button' onClick={this.toggleMenu.bind(this)}>
                    <span className='dropdown-menu-button-label'>{this.props.labelId ? <FormattedMessage id={this.props.labelId}/> : this.props.label}</span>
                </div>
                <div className='dropdown-menu-dropdown'>
                    <div className={`dropdown-menu-content-wrapper ${this.state.open ? 'show' : ''}`}>
                        <div className='dropdown-menu-content'>
                            {this.props.children}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default enhanceWithClickOutside(DropdownMenu);
