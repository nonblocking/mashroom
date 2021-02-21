
import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';

import type {PublishedMessages, ReceivedMessages} from '../types';

type Props = {
    publishedMessages: PublishedMessages,
    receivedMessages: ReceivedMessages,
}

export default class MessageBusHistory extends PureComponent<Props> {

    renderPublishedMessages() {
        const { publishedMessages } = this.props;
        if (publishedMessages.length === 0) {
            return null;
        }

        return (
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
        );
    }

    renderReceivedMessages() {
        const { receivedMessages } = this.props;
        if (receivedMessages.length === 0) {
            return null;
        }

        return (
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
        );
    }

    render() {
        return (
            <div className='mashroom-demo-remote-messaging-app-history'>
                <div className='mashroom-demo-remote-messaging-app-output-row'>
                    <div>
                        <FormattedMessage id='publishedRemoteMessages' />
                    </div>
                    <div>
                        {this.renderPublishedMessages()}
                    </div>
                </div>
                <div className='mashroom-demo-remote-messaging-app-output-row'>
                    <div>
                        <FormattedMessage id='receivedRemoteMessages' />
                    </div>
                    <div>
                        {this.renderReceivedMessages()}
                    </div>
                </div>
            </div>
        );
    }

}
