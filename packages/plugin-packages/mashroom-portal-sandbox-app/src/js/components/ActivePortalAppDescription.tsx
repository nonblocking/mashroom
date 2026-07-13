import React, {useCallback, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import useStore from '../store/useStore';
import {QUERY_PARAM_APP_CONFIG, QUERY_PARAM_APP_NAME, QUERY_PARAM_LANG, QUERY_PARAM_PERMISSIONS, QUERY_PARAM_WIDTH} from '../constants';

export default () => {
    const {t} = useTranslation();
    const [permalinkCopiedToClipboard, setPermalinkCopiedToClipboard] = useState<boolean>(false);
    const activePortalApp = useStore((state) => state.activePortalApp);
    const {width: currentHostWidth} = useStore((state) => state.host);

    const permalink = useMemo(() => {
        if (activePortalApp) {
            const queryParamsArray: Array<string> = [];
            queryParamsArray.push(`${QUERY_PARAM_APP_NAME}=${encodeURIComponent(activePortalApp.appName)}`);
            queryParamsArray.push(`${QUERY_PARAM_APP_CONFIG}=${btoa(JSON.stringify(activePortalApp.setup.appConfig))}`);
            queryParamsArray.push(`${QUERY_PARAM_PERMISSIONS}=${btoa(JSON.stringify(activePortalApp.setup.user.permissions))}`);
            queryParamsArray.push(`${QUERY_PARAM_LANG}=${activePortalApp.setup.lang}`);
            queryParamsArray.push(`${QUERY_PARAM_WIDTH}=${encodeURIComponent(currentHostWidth)}`);
            return `${document.location.origin + document.location.pathname}?${queryParamsArray.join('&')}`;
        }
        return '';
    }, [activePortalApp, currentHostWidth]);

    const copyToClipboard = useCallback((text: string) => {
        navigator.clipboard.writeText(text);
        setPermalinkCopiedToClipboard(true);
        // Optionally, reset the message after a few seconds
        setTimeout(() => setPermalinkCopiedToClipboard(false), 3000);
    }, []);

    if (!activePortalApp) {
        return null;
    }

    return (
        <div>
            <div className='mashroom-sandbox-app-output-row'>
                <div>
                    {t('sandboxPermalink')}
                </div>
                <div>
                    <a href={permalink} target='_blank' rel="noreferrer">
                        {t('link')}
                    </a>
                    <div className='mashroom-sandbox-copy-permalink' onClick={() => copyToClipboard(permalink)}></div>
                    {permalinkCopiedToClipboard && (
                        <div className='mashroom-sandbox-permalink-copied'>
                            {t('copiedToClipboard')}
                        </div>
                    )}
                </div>
            </div>
            <div className='mashroom-sandbox-app-output-row'>
                <div>
                    {t('appName')}
                </div>
                <div>
                    <strong id='mashroom-sandbox-app-name'>{activePortalApp.appName}</strong>
                </div>
            </div>
            <div className='mashroom-sandbox-app-output-row'>
                <div>
                    {t('appSetup')}
                </div>
                <div>
                    <pre id='mashroom-sandbox-app-setup'>{JSON.stringify(activePortalApp.setup, null, 2)}</pre>
                </div>
            </div>
        </div>
    );
};
