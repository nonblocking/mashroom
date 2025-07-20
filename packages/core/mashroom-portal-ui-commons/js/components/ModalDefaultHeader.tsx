import React from 'react';
import {useTranslation} from 'react-i18next';

type Props = {
    titleId?: string;
    title?: string;
    onClose: () => void;
}

export default ({titleId, title, onClose}: Props) => {
    const {t} = useTranslation();

    return (
        <div className='mashroom-portal-ui-modal-header'>
            <div className='title'>
                {titleId ? t(titleId) : title}
            </div>
            <div className='close-button' onClick={onClose}/>
        </div>
    );
};
