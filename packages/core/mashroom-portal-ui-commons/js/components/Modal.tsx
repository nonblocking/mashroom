
import React, {useEffect, useMemo, useRef, useState} from 'react';
import ReactDOM from 'react-dom';
import {FormattedMessage} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';
import {setShowModal} from '../store/actions';

import type {ReactNode} from 'react';
import type {CommonState} from '../../type-definitions';

type Props = {
    name: string;
    titleId?: string;
    title?: string | undefined | null;
    closeRef?: (close: () => void) => void,
    children: ReactNode;
    appWrapperClassName: string;
    className?: string;
    customHeader?: ReactNode;
    width?: number;
    minHeight?: number;
}

const MODALS_ROOT_ID = 'mashroom-portal-ui-modals-root';

export default ({name, titleId, title, closeRef, children, appWrapperClassName, className, customHeader, width, minHeight}: Props) => {
    const [fadeIn, setFadeIn] = useState(false);
    const [fadeOut, setFadeOut] = useState(false);
    const [marginTop, setMarginTop] = useState<string | undefined>(undefined);
    const modalWrapperElRef = useRef<HTMLDivElement | null>(null);
    const show = useSelector((state: CommonState) => state.modals?.[name]?.show);
    const shown = useRef(show);
    const dispatch = useDispatch();

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

    const close = () => {
        dispatch(setShowModal(name, false));
    };

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

    const handleEscapeKeyPress = (event: KeyboardEvent) => {
        if (event.target) {
            const target = event.target as HTMLElement;
            const fromInput = ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(target.tagName) !== -1;
            if (!fromInput && event.key === 'Escape') {
                close();
            }
        }
    };

    const onResize = () => {
        setMarginTop(calcMarginTop());
    };

    const calcMarginTop = (): string | undefined => {
        if (!modalWrapperElRef.current) {
            return undefined;
        }

        return `${Math.max(10, (window.innerHeight - modalWrapperElRef.current.offsetHeight) / 2)}px`;
    };

    if (!show && !fadeOut) {
        return null;
    }

    let header;
    if (customHeader) {
        header = customHeader;
    } else {
        header = (
            <div className='mashroom-portal-ui-modal-header'>
                <div className='title'>
                    {titleId ? <FormattedMessage id={titleId}/> : title}
                </div>
                <div className='close-button' onClick={close}/>
            </div>
        );
    }

    return ReactDOM.createPortal((
        <div className={`mashroom-portal-ui-modal ${className || ''}`} onWheel={(e) => e.stopPropagation()}>
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

