
import React, {useCallback, useEffect, useRef, useState} from 'react';
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

export default ({className, label, labelId, children, onOpen, onClose, closeRef}: Props) => {
    const ref = useRef<HTMLDivElement | null>(null);
    const [open, setOpen] = useState(false);

    const openDropDown = () => {
        setOpen(true);
        onOpen?.();
    };

    const closeDropDown = () => {
        setOpen(false);
        onClose?.();
    };

    const toggleDropDown = useCallback(() => {
        if (open) {
            closeDropDown();
        } else {
            openDropDown();
        }
    }, []);

    const handleEscapeKeyPress = useCallback((event: KeyboardEvent) => {
        if (event.code === 'Escape') {
            closeDropDown();
        }
    }, []);

    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
            closeDropDown();
        }
    }, []);

    useEffect(() => {
        closeRef?.(() => closeDropDown());
    }, []);

    useEffect(() => {
        if (open) {
            document.addEventListener('keydown', handleEscapeKeyPress);
            document.addEventListener('click', handleClickOutside);
            return () => {
                document.removeEventListener('keydown', handleEscapeKeyPress);
                document.removeEventListener('click', handleClickOutside);
            };
        }
    }, [open, handleEscapeKeyPress, handleClickOutside]);

    return (
        <div className={`mashroom-portal-ui-dropdown-menu ${className || ''}`} ref={ref}>
            <div className='dropdown-menu-button' onClick={toggleDropDown}>
                <span className='dropdown-menu-button-label'>{labelId ? <FormattedMessage id={labelId}/> : label}</span>
            </div>
            <div className='dropdown-menu-dropdown'>
                <div className={`dropdown-menu-content-wrapper ${open ? 'show' : ''}`}>
                    <div className='dropdown-menu-content'>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};
