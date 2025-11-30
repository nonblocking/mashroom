
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import ReactDOM from 'react-dom';
import ModalDefaultHeader from './ModalDefaultHeader';

import type {ReactNode, MouseEvent} from 'react';

type Props = {
    show: boolean;
    close: () => void;
    titleId?: string;
    title?: string;
    closeRef?: (close: () => void) => void,
    children: ReactNode;
    appWrapperClassName: string;
    className?: string;
    customHeader?: ReactNode;
    width?: number;
    minHeight?: number;
}

const MODALS_ROOT_ID = 'mashroom-portal-ui-modals-root';

export default ({show, close, titleId, title, closeRef, children, appWrapperClassName, className, customHeader, width, minHeight}: Props) => {
    const [fadeIn, setFadeIn] = useState(false);
    const [fadeOut, setFadeOut] = useState(false);
    const [marginTop, setMarginTop] = useState<string | undefined>(undefined);
    const modalWrapperElRef = useRef<HTMLDivElement | null>(null);
    const shown = useRef(show);

    const calcMarginTop = (): string | undefined => {
        if (!modalWrapperElRef.current) {
            return undefined;
        }
        return `${Math.max(10, (window.innerHeight - modalWrapperElRef.current.offsetHeight) / 2)}px`;
    };

    const handleEscapeKeyPress = useCallback((event: KeyboardEvent) => {
        if (event.target) {
            const target = event.target as HTMLElement;
            const fromInput = ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(target.tagName) !== -1;
            if (!fromInput && event.key === 'Escape') {
                close();
            }
        }
    }, []);

    const onResize =  useCallback(() => {
        setMarginTop(calcMarginTop());
    }, []);

    useEffect(() => {
        closeRef?.(() => close());
        setFadeIn(false);
    }, []);

    useEffect(() => {
        if (show) {
            shown.current = true;
            setTimeout(() => {
                setFadeIn(true);
                setFadeOut(false);
                setMarginTop(calcMarginTop());
            }, 100);
            window.addEventListener('keyup', handleEscapeKeyPress);
            window.addEventListener('resize', onResize);
        } else if (shown.current) {
            shown.current = false;
            setFadeOut(true);
            window.removeEventListener('keyup', handleEscapeKeyPress);
            window.removeEventListener('resize', onResize);
            setTimeout(() => {
                setFadeIn(false);
                setFadeOut(false);
            }, 200);
        }
    }, [show]);

    const modalsRoot = useMemo(() => {
        let modalsRoot = document.getElementById(MODALS_ROOT_ID);
        if (!modalsRoot) {
            modalsRoot = document.createElement('div');
            modalsRoot.id = MODALS_ROOT_ID;
            modalsRoot.className = appWrapperClassName;
            modalsRoot.style.height = '0';
            if (document.body) {
                document.body.appendChild(modalsRoot);
            }
        }
        return modalsRoot;
    }, []);

    const stopPropagation = useCallback((event: MouseEvent) => event.stopPropagation(), []);

    if (!show && !fadeOut) {
        return null;
    }

    let header;
    if (customHeader) {
        header = customHeader;
    } else {
        header = <ModalDefaultHeader titleId={titleId} title={title} onClose={close} />;
    }

    return ReactDOM.createPortal((
        <div className={`mashroom-portal-ui-modal ${className || ''}`} onWheel={stopPropagation}>
            <div className={`mashroom-portal-ui-modal-wrapper ${fadeIn ? 'fade-in' : ''} ${fadeOut ? 'fade-out' : ''}`}
                 style={{marginTop, width, minHeight}}
                 ref={modalWrapperElRef}>
                {header}
                <div className='mashroom-portal-ui-modal-content'>
                    {children}
                </div>
            </div>
        </div>
    ), modalsRoot);
};

