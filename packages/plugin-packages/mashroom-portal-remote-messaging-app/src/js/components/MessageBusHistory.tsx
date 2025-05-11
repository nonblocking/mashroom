
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {useSelector} from 'react-redux';
import type {State} from '../types';

export default () => {
    const {publishedMessages, receivedMessages} = useSelector((state: State) => state);

    return (
        <div className='mashroom-remote-messaging-app-history'>
            <div className='mashroom-remote-messaging-app-output-row'>
                <div>
                    <FormattedMessage id='sentRemoteMessages' />
                </div>
                <div>
                    <table className='table-striped'>
                        <thead>
                        <tr>
                            <th>
                                <FormattedMessage id='topic' />
                            </th>
                            <th>
                                <FormattedMessage id='message' />
                            </th>
                            <th>
                                <FormattedMessage id='status' />
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {
                            publishedMessages.map((m, idx) => (
                                <tr key={String(idx)}>
                                    <td>
                                        {m.topic}
                                    </td>
                                    <td >
                                <pre>
                                    {JSON.stringify(m.message, null, 2)}
                                </pre>
                                    </td>
                                    <td>
                                        <div className={`${m.status === 'Error' ? 'mashroom-portal-ui-error-message' : ''}`}>
                                            {m.status}
                                            &nbsp;
                                            {m.errorMessage ? `(${m.errorMessage})` : ''}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        }
                        </tbody>
                    </table>
                </div>
            </div>
            <div className='mashroom-remote-messaging-app-output-row'>
                <div>
                    <FormattedMessage id='receivedRemoteMessages' />
                </div>
                <div>
                    <table>
                        <thead>
                        <tr>
                            <th>
                                <FormattedMessage id='topic' />
                            </th>
                            <th>
                                <FormattedMessage id='message' />
                            </th>
                            <th>
                                <FormattedMessage id='timestamp' />
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {
                            receivedMessages.map((m, idx) => (
                                <tr key={String(idx)}>
                                    <td>
                                        {m.topic}
                                    </td>
                                    <td >
                                <pre>
                                    {JSON.stringify(m.message, null, 2)}
                                </pre>
                                    </td>
                                    <td>
                                        {new Date(m.timestamp).toISOString()}
                                    </td>
                                </tr>
                            ))
                        }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
