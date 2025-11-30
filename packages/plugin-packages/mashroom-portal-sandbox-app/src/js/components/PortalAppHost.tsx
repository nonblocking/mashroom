import React, { useRef, useCallback, useEffect } from 'react';
import { CircularProgress } from '@mashroom/mashroom-portal-ui-commons';
import {setHostWidth as setHostWidthAction} from '../store/actions';
import useStore from '../store/useStore';

type Props = {
    hostElementId: string;
}

export default ({hostElementId}: Props) => {
    const wrapperElemRef = useRef<HTMLDivElement | null>(null);
    const activePortalApp = useStore((state) => state.activePortalApp);
    const {width: hostWidth} = useStore((state) => state.host);
    const dispatch = useStore((state) => state.dispatch);
    const setHostWidth = (hostWidth: string) => dispatch(setHostWidthAction(hostWidth));

    const resizerMouseMove = useCallback((event: MouseEvent) => {
        if (!wrapperElemRef.current) {
            return;
        }
        // Calculate new width based on mouse position relative to the wrapper element
        const newWidth = Math.trunc(event.pageX - wrapperElemRef.current.getBoundingClientRect().left);
        if (newWidth > 100) { // Minimum width constraint
            setHostWidth(`${newWidth}px`);
        }
    }, []);

    const resizerMouseUp = useCallback(() => {
        global.removeEventListener('mousemove', resizerMouseMove);
        global.removeEventListener('mouseup', resizerMouseUp);
    }, [resizerMouseMove]);

    const resizerMouseDown = useCallback(() => {
        global.addEventListener('mousemove', resizerMouseMove);
        global.addEventListener('mouseup', resizerMouseUp);
    }, [resizerMouseMove, resizerMouseUp]);

    useEffect(() => {
        return () => {
            global.removeEventListener('mousemove', resizerMouseMove);
            global.removeEventListener('mouseup', resizerMouseUp);
        };
    }, [resizerMouseMove, resizerMouseUp]);

    if (!activePortalApp) {
        return null;
    }

    let currentWidth = hostWidth;
    // Ensure width is in 'px' if it's just a number string
    if (currentWidth.match(/^\d+$/)) {
        currentWidth = `${currentWidth}px`;
    }

    const pluginName = activePortalApp.setup.pluginName;
    const classFromPluginName = pluginName.toLowerCase().replace(/ /g, '-');

    return (
        <div
            className='mashroom-sandbox-app-host-wrapper'
            style={{ width: currentWidth }}
            ref={wrapperElemRef}
        >
            <div className='mashroom-sandbox-app-host-width'>
                {currentWidth}
            </div>
            <div
                id={hostElementId}
                className={`mashroom-sandbox-app-host-elem portal-app-${classFromPluginName}`}
            >
                <CircularProgress />
            </div>
            <div
                className='mashroom-sandbox-app-host-resizer'
                onMouseDown={resizerMouseDown} // Use the memoized handler
            >
                <div className='grip' />
            </div>
        </div>
    );
};

