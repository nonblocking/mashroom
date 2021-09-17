
import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';
import type {ReactNode} from 'react';

type Props = {
    id: string;
    labelId: string;
    type?: 'submit' | 'reset' | 'button';
    secondary?: boolean;
    onClick?: () => void;
    disabled?: boolean;
};

export default class Button extends PureComponent<Props> {

    render(): ReactNode {
        const {id, labelId, type, secondary, disabled, onClick} = this.props;
        return (
            <button id={id}
                    className={`mashroom-portal-ui-button ${secondary ? 'secondary' : ''}`}
                    type={type || 'button'}
                    onClick={onClick}
                    disabled={disabled}>
                <FormattedMessage id={labelId}/>
            </button>
        );
    }

}
