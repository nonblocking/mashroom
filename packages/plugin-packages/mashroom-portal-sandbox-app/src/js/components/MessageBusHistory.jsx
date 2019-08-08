// @flow

import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';

import type {
    ActivePortalApp,
    MessageBusCommunication,
    MessageBusMessage
} from '../../../type-definitions';

type Props = {
    activePortalApp: ?ActivePortalApp,
    messageBusCom: MessageBusCommunication,
    addReceivedMessage: (MessageBusMessage) => void,
}

export default class MessageBusHistory extends PureComponent<Props> {

    renderMessageTable(id: string, messages: Array<MessageBusMessage>) {
        if (messages.length === 0) {
            return '-';
        }

        return (
            <table id={id}>
                <thead>
                    <tr>
                        <th>
                            #
                        </th>
                        <th>
                            <FormattedMessage id='topic' />
                        </th>
                        <th>
                            <FormattedMessage id='message' />
                        </th>
                    </tr>
                </thead>
                <tbody>
                {
                    messages.map((m, idx) => (
                        <tr id={`mashroom-sandbox-app-${id}-message-${String(idx + 1)}`} key={String(idx)}>
                            <td>
                                {String(idx + 1)}
                            </td>
                            <td id={`mashroom-sandbox-app-${id}-message-${String(idx + 1)}-topic`}>
                                {m.topic}
                            </td>
                            <td id={`mashroom-sandbox-app-${id}-message-${String(idx + 1)}-message`}>
                                <pre>{JSON.stringify(m.data, null, 2)}</pre>
                            </td>
                        </tr>
                    ))
                }
                </tbody>
            </table>
        );
    }

    render() {
        const { activePortalApp, messageBusCom : { receivedMessages, sentMessages } } = this.props;
        if (!activePortalApp) {
            return null;
        }

        return (
            <div className='mashroom-sandbox-app-messagebus-history'>
                <div className='mashroom-sandbox-app-output-row'>
                    <FormattedMessage id='receivedMessages' />
                    <div>
                        {this.renderMessageTable('received', receivedMessages)}
                    </div>
                </div>
                <div className='mashroom-sandbox-app-output-row'>
                    <FormattedMessage id='sentMessages' />
                    <div>
                        {this.renderMessageTable('sent', sentMessages)}
                    </div>
                </div>
            </div>
        );
    }

}
