
import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';

type Props = {
    labelId: string;
    htmlFor?: string;
}

export default class FieldLabel extends PureComponent<Props> {

    render() {
        const {htmlFor, labelId} = this.props;
        return (
            <label htmlFor={htmlFor} className='mashroom-portal-ui-field-label'>
                <FormattedMessage id={labelId}/>
            </label>
        );
    }
}
