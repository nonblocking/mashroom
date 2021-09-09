
import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';
import type {ReactNode} from 'react';

type Props = {
    labelId: string;
    htmlFor?: string;
}

export default class FieldLabel extends PureComponent<Props> {

    render(): ReactNode {
        return (
            <label htmlFor={this.props.htmlFor} className='mashroom-portal-ui-field-label'>
                <FormattedMessage id={this.props.labelId}/>
            </label>
        );
    }
}
