
import React from 'react';
import {useTranslation} from 'react-i18next';

type Props = {
    id: string;
    labelId: string;
    type?: 'submit' | 'reset' | 'button';
    secondary?: boolean;
    onClick?: () => void;
    disabled?: boolean;
};

export default ({id, labelId, type, secondary, onClick, disabled}: Props) =>  {
    const {t} = useTranslation();
    return (
        <button id={id}
                className={`mashroom-portal-ui-button ${secondary ? 'secondary' : ''}`}
                type={type || 'button'}
                onClick={onClick}
                disabled={disabled}>
            {t(labelId)}
        </button>
    );
};
