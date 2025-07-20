
import React from 'react';
import {useTranslation} from 'react-i18next';

type Props = {
    labelId: string;
    htmlFor?: string;
}

export default ({labelId, htmlFor}: Props) => {
    const {t} = useTranslation();

    return (
        <label htmlFor={htmlFor} className='mashroom-portal-ui-field-label'>
            {t(labelId)}
        </label>
    );
};
