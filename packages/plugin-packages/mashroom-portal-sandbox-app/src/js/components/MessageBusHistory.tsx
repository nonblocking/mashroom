
import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';

import type {ReactNode} from 'react';
import type {
    ActivePortalApp,
    MessageBusCommunication,
    MessageBusMessage
} from '../types';

type Props = {
    activePortalApp: ActivePortalApp | undefined | null;
    messageBusCom: MessageBusCommunication;
}

export default class MessageBusHistory extends PureComponent<Props> {

    renderMessageTable(id: string, messages: Array<MessageBusMessage>): ReactNode {
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
                        <tr key={String(idx)}>
                            <td>
                                {String(idx + 1)}
                            </td>
                            <td>
                                <div id={`mashroom-sandbox-app-${id}-${String(idx + 1)}-topic`}>
                                    {m.topic}
                                </div>
                            </td>
                            <td >
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
    }

    render(): ReactNode {
        const { activePortalApp, messageBusCom : { publishedByApp, publishedBySandbox } } = this.props;
        if (!activePortalApp) {
            return null;
        }

        return (
            <div className='mashroom-sandbox-app-messagebus-history'>
                <div className='mashroom-sandbox-app-output-row'>
                    <div>
                        <FormattedMessage id='publishedByApp' />
                    </div>
                    <div>
                        {this.renderMessageTable('published-by-app', publishedByApp)}
                    </div>
                </div>
                <div className='mashroom-sandbox-app-output-row'>
                    <div>
                        <FormattedMessage id='publishedBySandbox' />
                    </div>
                    <div>
                        {this.renderMessageTable('published-by-sandbox', publishedBySandbox)}
                    </div>
                </div>
            </div>
        );
    }

}
