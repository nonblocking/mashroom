
import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';
import type {ReactNode} from 'react';

type Props = {
    labelId: string;
    htmlFor?: string;
}

export default class FieldLabel extends PureComponent<Props> {

    render(): ReactNode {
        const {htmlFor, labelId} = this.props;
        return (
            <label htmlFor={htmlFor} className='mashroom-portal-ui-field-label'>
                <FormattedMessage id={labelId}/>
            </label>
        );
    }
}
