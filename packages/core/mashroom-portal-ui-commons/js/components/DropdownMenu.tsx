
import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';

import type {ReactNode} from 'react';

type Props = {
    className?: string;
    label?: string;
    labelId?: string;
    children: ReactNode;
    onOpen?: () => void;
    onClose?: () => void;
    closeRef?: (close: () => void) => void;
};

type State = {
    open: boolean;
};

class DropdownMenu extends PureComponent<Props, State> {

    ref: HTMLDivElement | null = null;
    boundHandleEscapeKeyPress: (event: KeyboardEvent) => void;

    constructor(props: Props) {
        super(props);
        this.boundHandleEscapeKeyPress = this.handleEscapeKeyPress.bind(this);
        this.state = {
            open: false,
        };
    }

    componentDidMount() {
        const {closeRef} = this.props;
        if (closeRef) {
            closeRef(this.hideMenu.bind(this));
        }
        document.addEventListener('click', this.handleClickOutside.bind(this));
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.handleClickOutside.bind(this));
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

    handleClickOutside(event: MouseEvent) {
        if (this.ref && !this.ref.contains(event.target as Node)) {
            this.closeDropDown();
        }
    }

    handleEscapeKeyPress(event: KeyboardEvent) {
        if (event.code === 'Escape') {
           this.closeDropDown();
        }
    }

    toggleMenu() {
        const {onOpen} = this.props;
        const {open} = this.state;
        if (!open) {
            this.openDropDown();
            if (onOpen) {
                onOpen();
            }
        } else {
            this.closeDropDown();
        }
    }

    hideMenu() {
        const {onClose} = this.props;
        this.setState({
            open: false,
        });

        if (onClose) {
            onClose();
        }
    }

    render() {
        const {className, labelId, label, children} = this.props;
        return (
            <div className={`mashroom-portal-ui-dropdown-menu ${className || ''}`} ref={(el) => { this.ref = el; }}>
                <div className='dropdown-menu-button' onClick={this.toggleMenu.bind(this)}>
                    <span className='dropdown-menu-button-label'>{labelId ? <FormattedMessage id={labelId}/> : label}</span>
                </div>
                <div className='dropdown-menu-dropdown'>
                    <div className={`dropdown-menu-content-wrapper ${this.state.open ? 'show' : ''}`}>
                        <div className='dropdown-menu-content'>
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default DropdownMenu;
