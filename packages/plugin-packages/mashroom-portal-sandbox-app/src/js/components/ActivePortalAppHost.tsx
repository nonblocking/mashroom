import React, {useRef, useCallback, useEffect, useMemo} from 'react';
import {nanoid} from 'nanoid';
import { CircularProgress } from '@mashroom/mashroom-portal-ui-commons';
import {addMessagePublishedByApp, setHostWidth as setHostWidthAction, setTopicsSubscribedByApp} from '../store/actions';
import useStore from '../store/useStore';
import loadPortalApp from '../load-portal-app';
import unloadPortalApp from '../unload-portal-app';
import getMessageBusPortalAppUnderTest from '../message-bus-portal-app-under-test';
import type {LoadedPortalApp} from '../types';

export default () => {
    const activePortalApp = useStore((state) => state.activePortalApp);
    const {width: hostWidth} = useStore((state) => state.host);
    const dispatch = useStore((state) => state.dispatch);
    const setHostWidth = (hostWidth: string) => dispatch(setHostWidthAction(hostWidth));
    const hostElementId = useMemo(() => `mashroom-sandbox-app-host-elem_${nanoid(8)}`, []);
    const hiddenHostElementId = useMemo(() => `mashroom-sandbox-app-host-elem_${nanoid(8)}`, []);
    const messageBusPortalAppUnderTest = useMemo(() => {
        const messageBus = getMessageBusPortalAppUnderTest();
        messageBus.onMessageSent((topic, data) => {
            dispatch(addMessagePublishedByApp({
                topic,
                data
            }));
        });
        messageBus.onTopicsChanged((topics) => {
            dispatch(setTopicsSubscribedByApp(topics));
        });
        return messageBus;
    }, [activePortalApp]);
    const wrapperElemRef = useRef<HTMLDivElement | null>(null);

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

    useEffect(() => {
        if (activePortalApp) {
            const { appName, setup } = activePortalApp!;
            let loadedApp: LoadedPortalApp | undefined;
            (async () => {
                try {
                    loadedApp = await loadPortalApp(appName, hostElementId, hiddenHostElementId, setup, messageBusPortalAppUnderTest);
                } catch (error) {
                    console.error('Loading app failed', error);
                }
            })();
            return () => {
                if (loadedApp) {
                    unloadPortalApp(loadedApp);
                }
            };
        }
    }, [activePortalApp]);

    if (!activePortalApp) {
        return null;
    }

    let currentWidth = hostWidth;
    // Ensure the width is in 'px' if it's just a number string
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
            <div id={hiddenHostElementId} style={{ display: 'none' }} />
        </div>
    );
};

