
import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';
import type {ReactNode} from 'react';

type Props = {
    messageId: string;
};

export default class ErrorMessage extends PureComponent<Props> {

    render(): ReactNode {
        const {messageId} = this.props;
        return (
            <div className='mashroom-portal-ui-error-message'>
                <FormattedMessage id={messageId}/>
            </div>
        );
    }

}
