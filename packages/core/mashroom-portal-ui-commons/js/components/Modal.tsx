
import React, {PureComponent} from 'react';
import ReactDOM from 'react-dom';
import {FormattedMessage} from 'react-intl';


import type {ReactNode} from 'react';

type Props = {
    name: string;
    titleId?: string;
    title?: string | undefined | null;
    show: boolean;
    onClose: () => void;
    closeRef?: (close: () => void) => void,
    children: ReactNode;
    appWrapperClassName: string;
    className?: string;
    customHeader?: ReactNode;
    minWidth?: number;
    minHeight?: number;
}

type State = {
    fadeIn: boolean;
    fadeOut: boolean;
    marginTop: string | undefined;
}

const MODALS_ROOT_ID = 'mashroom-portal-ui-modals-root';

export default class ModalDialog extends PureComponent<Props, State> {

    boundOnResize: () => void;
    boundHandleEscapeKeyPress: (event: KeyboardEvent) => void;
    modalsRoot: HTMLElement | null;
    modalWrapperEl: HTMLElement | null;

    constructor(props: Props) {
        super(props);
        this.state = {
            fadeIn: false,
            fadeOut: false,
            marginTop: undefined,
        };

        this.modalsRoot = document.getElementById(MODALS_ROOT_ID);
        if (!this.modalsRoot) {
            this.modalsRoot = document.createElement('div');
            this.modalsRoot.id = MODALS_ROOT_ID;
            this.modalsRoot.className = props.appWrapperClassName;
            this.modalsRoot.style.height = '0';
            document.body && document.body.appendChild(this.modalsRoot);
        }
        this.modalWrapperEl = null;
        this.boundHandleEscapeKeyPress = this.handleEscapeKeyPress.bind(this);
        this.boundOnResize = this.onResize.bind(this);
    }

    componentDidMount(): void {
        const closeRef = this.props.closeRef;
        if (typeof(closeRef) === 'function') {
            closeRef(this.close.bind(this));
        }
        this.setState({
           fadeIn: false,
        });

    }

    componentDidUpdate(prevProps: Props): void {
        if (this.props.show !== prevProps.show) {
            if (this.props.show) {
                setTimeout(() => {
                    this.setState({
                        fadeIn: true,
                        fadeOut: false,
                        marginTop: this.calcMarginTop(),
                    });
                }, 100);
                window.addEventListener('keyup', this.boundHandleEscapeKeyPress);
                window.addEventListener('resize', this.boundOnResize);
            } else {
                this.setState({
                    fadeOut: true,
                });
                window.removeEventListener('keyup', this.boundHandleEscapeKeyPress);
                window.removeEventListener('resize', this.boundOnResize);
                setTimeout(() => {
                    this.setState({
                        fadeIn: false,
                        fadeOut: false,
                    });
                }, 200);
            }
        }
    }

    handleEscapeKeyPress(event: KeyboardEvent): void {
        if (event.target) {
            const target = event.target as HTMLElement;
            const fromInput = ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(target.tagName) !== -1;
            if (!fromInput && event.key === 'Escape') {
                this.close();
            }
        }
    }

    onResize(): void {
        this.setState({
            marginTop: this.calcMarginTop(),
        });
    }

    close(): void {
        if (this.props.onClose) {
            this.props.onClose();
        }
    }

    calcMarginTop(): string | undefined {
        if (!this.modalWrapperEl) {
            return undefined;
        }

        return `${Math.max(10, (window.innerHeight - this.modalWrapperEl.offsetHeight) / 2)}px`;
    }

    renderDefaultHeader(): ReactNode {
        return (
            <div className='mashroom-portal-ui-modal-header'>
                <div className='title'>
                    {this.props.titleId ? <FormattedMessage id={this.props.titleId}/> : this.props.title}
                </div>
                <div className='close-button' onClick={this.close.bind(this)}/>
            </div>
        );
    }

    render(): ReactNode {
        if (!this.modalsRoot || (!this.props.show && !this.state.fadeOut)) {
            return null;
        }

        let header = null;
        if (this.props.customHeader) {
            header = this.props.customHeader;
        } else {
            header = this.renderDefaultHeader();
        }

        return ReactDOM.createPortal((
                <div className={`mashroom-portal-ui-modal ${this.props.className || ''}`} onWheel={(e) => e.stopPropagation()}>
                    <div className={`mashroom-portal-ui-modal-wrapper ${this.state.fadeIn ? 'fade-in' : ''} ${this.state.fadeOut ? 'fade-out' : ''}`}
                         style={{marginTop: this.state.marginTop}}
                         ref={(elem) => this.modalWrapperEl = elem}>
                        {header}
                        <div className='mashroom-portal-ui-modal-content' style={{minWidth: this.props.minWidth || 'auto', minHeight: this.props.minHeight || 'auto'}}>
                            {this.props.children}
                        </div>
                    </div>
                </div>
            ), this.modalsRoot);
    }

}

