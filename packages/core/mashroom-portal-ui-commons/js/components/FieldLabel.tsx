
import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';

type Props = {
    labelId: string;
    htmlFor?: string;
}

export default class FieldLabel extends PureComponent<Props> {

    render() {
        return (
            <label htmlFor={this.props.htmlFor} className='mashroom-portal-ui-field-label'>
                <FormattedMessage id={this.props.labelId}/>
            </label>
        );
    }
}
