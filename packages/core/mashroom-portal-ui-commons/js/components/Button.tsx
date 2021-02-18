
import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';

type Props = {
    id: string;
    labelId: string;
    type?: 'submit' | 'reset' | 'button';
    onClick?: () => void;
    disabled?: boolean;
};

export default class Button extends PureComponent<Props> {

    render() {
        return (
            <button id={this.props.id} className='mashroom-portal-ui-button' type={this.props.type || 'button'} onClick={this.props.onClick} disabled={this.props.disabled}>
                <FormattedMessage id={this.props.labelId}/>
            </button>
        );
    }

}
