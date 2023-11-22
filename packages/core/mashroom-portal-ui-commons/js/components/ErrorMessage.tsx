
import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';

type Props = {
    messageId: string;
};

export default class ErrorMessage extends PureComponent<Props> {

    render() {
        const {messageId} = this.props;
        // The messageId can contain placeholder values after ::
        const [id, ...values] = messageId.split('::');
        const valuesObject: any =  {};
        values.forEach((keyAndVal) => {
           const [key, val] = keyAndVal.split(':');
           valuesObject[key] = val;
        });
        return (
            <div className='mashroom-portal-ui-error-message'>
                <FormattedMessage id={id} values={valuesObject} />
            </div>
        );
    }

}
