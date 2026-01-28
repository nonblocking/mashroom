import React  from 'react';
import {ErrorMessage, FieldLabel} from '@mashroom/mashroom-portal-ui-commons';
import {useField} from 'formik';
import useStore from '../store/useStore';

import type { I18NString } from '@mashroom/mashroom/type-definitions';

type Props = {
    id: string,
    name: string;
    labelId: string,
}

export default ({ name, labelId}: Props) => {
    const [field, meta, helpers] = useField(name);
    const languages = useStore((state) => state.languages);

    const getValue = (): Record<string, string> => {
        let val: I18NString = field.value;
        if (typeof (val) === 'string') {
            val = {
                [languages.default]: val
            };
        }
        return val || {
            [languages.default]: ''
        };
    };

    const handleValueChange = (lang: string, value: string | undefined | null): void => {
        const val = { ...getValue(), [lang]: value };
        helpers.setValue(val);
    };

    const handleBlur = () => {
        helpers.setTouched(true);
    };

    const handleAddLang = (lang: string) => {
        const val = { ...getValue(), [lang]: '' };
        helpers.setValue(val);
    };

    const handleRemoveLang = (lang: string) => {
        const val = { ...getValue() };
        delete val[lang];
        helpers.setValue(val);
    };

    const error = meta.touched && !!meta.error;
    const val = getValue();
    let availableLanguages = [...languages.available];
    availableLanguages = availableLanguages.filter((l) => l !== languages.default);
    const inputFields = [];

    inputFields.push(
        <input key='default-lang' type='text'
               name={field.name}
               value={val[languages.default] ?? ''}
               onChange={(e) => handleValueChange(languages.default, e.target.value)}
               onBlur={handleBlur}
        />
    );
    for (const lang of languages.available) {
        if (lang === languages.default) {
            continue;
        }
        if (typeof (val[lang]) !== 'undefined') {
            inputFields.push(
                <div key={lang} className='translation'>
                    <div className='lang'>{lang}:</div>
                    <input type='text'
                           name={`${field.name}.${lang}`}
                           value={val[lang] ?? ''}
                           onChange={(e) => handleValueChange(lang, e.target.value)}
                           onBlur={handleBlur}
                    />
                    <div className='remove' onClick={() => handleRemoveLang(lang)}>&nbsp;</div>
                </div>
            );
            availableLanguages = availableLanguages.filter((l) => l !== lang);
        }
    }

    if (availableLanguages.length >= 0) {
        inputFields.push(
            <div key='available-languages' className='available-languages'>
                {availableLanguages.map((lang) => (
                    <span key={lang} className='add-language' onClick={() => handleAddLang(lang)}>
                        {lang}
                    </span>
                ))}
            </div>
        );
    }

    return (
        <div className={`i18nstring-field mashroom-portal-ui-input ${error ? 'error' : ''}`}>
            <FieldLabel labelId={labelId} />
            <div>
                <div className='i18n-field-inputs'>
                    {inputFields}
                </div>
                {error && <ErrorMessage messageId={meta.error || ''} />}
            </div>
        </div>
    );
};
