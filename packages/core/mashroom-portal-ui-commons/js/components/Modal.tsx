
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
    width?: number;
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
        const {closeRef} = this.props;
        if (typeof(closeRef) === 'function') {
            closeRef(this.close.bind(this));
        }
        this.setState({
           fadeIn: false,
        });

    }

    componentDidUpdate(prevProps: Props): void {
        const {show} = this.props;
        if (show !== prevProps.show) {
            if (show) {
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
        const {onClose} = this.props;
        if (onClose) {
            onClose();
        }
    }

    calcMarginTop(): string | undefined {
        if (!this.modalWrapperEl) {
            return undefined;
        }

        return `${Math.max(10, (window.innerHeight - this.modalWrapperEl.offsetHeight) / 2)}px`;
    }

    renderDefaultHeader(): ReactNode {
        const {titleId, title} = this.props;
        return (
            <div className='mashroom-portal-ui-modal-header'>
                <div className='title'>
                    {titleId ? <FormattedMessage id={titleId}/> : title}
                </div>
                <div className='close-button' onClick={this.close.bind(this)}/>
            </div>
        );
    }

    render(): ReactNode {
        const {show, customHeader, className, minHeight, width, children} = this.props;
        const {fadeOut, fadeIn, marginTop} = this.state;
        if (!this.modalsRoot || (!show && !fadeOut)) {
            return null;
        }

        let header;
        if (customHeader) {
            header = customHeader;
        } else {
            header = this.renderDefaultHeader();
        }

        return ReactDOM.createPortal((
                <div className={`mashroom-portal-ui-modal ${className || ''}`} onWheel={(e) => e.stopPropagation()}>
                    <div className={`mashroom-portal-ui-modal-wrapper ${fadeIn ? 'fade-in' : ''} ${fadeOut ? 'fade-out' : ''}`}
                         style={{marginTop, width, minHeight}}
                         ref={(elem) => this.modalWrapperEl = elem}>
                        {header}
                        <div className='mashroom-portal-ui-modal-content'>
                            {children}
                        </div>
                    </div>
                </div>
            ), this.modalsRoot);
    }

}

