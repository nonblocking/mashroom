import React from 'react';
import {Button} from '@mashroom/mashroom-portal-ui-commons';
import {setActivePortalApp as setActivePortalAppAction, setSelectedPortalApp} from '../store/actions';
import useStore from '../store/useStore';

export default () => {
    const activePortalApp = useStore((state) => state.activePortalApp);
    const dispatch = useStore((state) => state.dispatch);
    const closeActivePortalApp = () => {
        dispatch(setActivePortalAppAction(null));
        dispatch(setSelectedPortalApp(null));
    };

    if (!activePortalApp) {
        return null;
    }

    return (
        <div className="mashroom-sandbox-app-close-active-app">
            <Button id='mashroom-sandbox-close-active-app' type='submit' labelId='closeActiveApp' onClick={closeActivePortalApp} />
        </div>
    );
};
