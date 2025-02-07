import React, {useCallback, useEffect} from 'react';
import { createPortal } from 'react-dom';
import styles from './ScreenshotOverlay.scss';

type Props = {
    src: string | undefined;
    onClose: () => void;
}

export default ({src, onClose}: Props) => {
    useEffect(() => {
        if (src) {
            window.document.addEventListener('keydown', onEscCb);
        } else {
            window.document.removeEventListener('keydown', onEscCb);
        }
    }, [src]);

    const onEscCb = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    return createPortal((
            <div className={`${styles.ScreenshotOverlay} ${src ? styles.Show : ''}`} onClick={onClose}>
                <img src={src} alt="" />
            </div>
        ), document.body,
    );
};
