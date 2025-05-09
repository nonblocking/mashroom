
import React from 'react';
import {FormattedMessage} from 'react-intl';

type Props = {
    id: string;
    labelId: string;
    type?: 'submit' | 'reset' | 'button';
    secondary?: boolean;
    onClick?: () => void;
    disabled?: boolean;
};

export default ({id, labelId, type, secondary, onClick, disabled}: Props) =>  {
    return (
        <button id={id}
                className={`mashroom-portal-ui-button ${secondary ? 'secondary' : ''}`}
                type={type || 'button'}
                onClick={onClick}
                disabled={disabled}>
            <FormattedMessage id={labelId}/>
        </button>
    );
};
