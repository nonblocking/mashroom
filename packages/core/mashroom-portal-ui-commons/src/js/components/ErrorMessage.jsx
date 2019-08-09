// @flow

import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';

type Props = {
    messageId: string,
};

export default class ErrorMessage extends PureComponent<Props> {

    render() {
        return (
            <div className='mashroom-portal-ui-error-message'>
                <FormattedMessage id={this.props.messageId}/>
            </div>
        );
    }

}
