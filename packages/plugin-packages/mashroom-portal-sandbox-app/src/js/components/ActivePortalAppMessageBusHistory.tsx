
import React from 'react';
import {useTranslation} from 'react-i18next';
import useStore from '../store/useStore';

import type {MessageBusMessage} from '../types';

const MessagesTable = ({id, messages}: {id: string, messages: Array<MessageBusMessage>}) => {
    const {t} = useTranslation();

    if (messages.length === 0) {
        return '-';
    }

    return (
        <table className='table-striped' id={id}>
            <thead>
            <tr>
                <th>
                    #
                </th>
                <th>
                    {t('topic')}
                </th>
                <th>
                    {t('message')}
                </th>
            </tr>
            </thead>
            <tbody>
            {
                messages.map((m, idx) => (
                    <tr key={String(idx)}>
                        <td>
                            {String(idx + 1)}
                        </td>
                        <td>
                            <div id={`mashroom-sandbox-app-${id}-${String(idx + 1)}-topic`}>
                                {m.topic}
                            </div>
                        </td>
                        <td>
                            <pre id={`mashroom-sandbox-app-${id}-${String(idx + 1)}-message`}>
                                {JSON.stringify(m.data, null, 2)}
                            </pre>
                        </td>
                    </tr>
                ))
            }
            </tbody>
        </table>
    );
};

export default () => {
    const {t} = useTranslation();
    const activePortalApp = useStore((state) => state.activePortalApp);
    const {publishedByApp, publishedBySandbox} = useStore((state) => state.messageBusCom);

    if (!activePortalApp) {
        return null;
    }

    return (
        <div className='mashroom-sandbox-app-messagebus-history'>
            <div className='mashroom-sandbox-app-output-row'>
                <div>
                    {t('messagesFromApp')}
                </div>
                <div>
                    <MessagesTable id='published-by-app' messages={publishedByApp} />
                </div>
            </div>
            <div className='mashroom-sandbox-app-output-row'>
                <div>
                    {t('messagesFromSandbox')}
                </div>
                <div>
                    <MessagesTable id='published-by-sandbox' messages={publishedBySandbox} />
                </div>
            </div>
        </div>
    );

};

