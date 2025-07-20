
import React from 'react';
import {useTranslation} from 'react-i18next';

type Props = {
    labelId?: string;
    label?: string;
    onClick?: () => void;
};

export default ({labelId, label, onClick}: Props) => {
    const {t} = useTranslation();
    return (
        <div className='mashroom-portal-ui-dropdown-menu-item' onClick={onClick}>
            <span className='dropdown-menu-item-label'>{labelId ? t(labelId) : label}</span>
        </div>
    );
};
