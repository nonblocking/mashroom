import React, {useEffect, useState} from 'react';
import i18nNext from 'i18next';
import {I18nextProvider, initReactI18next} from 'react-i18next';
import type {ReactNode} from 'react';
import type {i18n} from 'i18next';

type Props = {
    lang: string;
    children: ReactNode;
}

export default ({lang, children}: Props) => {
    const [i18nInst, setI18nInst] = useState<i18n | null>(null);

    useEffect(() => {
        const initI18n = async () => {
            try {
                let translations;
                try {
                    translations = await import(`./${lang}`);
                } catch {
                    translations = await import(`./en`);
                }
                const inst = i18nNext.createInstance();
                await inst.use(initReactI18next)
                    .init({
                        lng: lang,
                        resources: {
                            [lang]: {
                                translation: translations.default,
                            },
                        }
                    });
                setI18nInst(inst);
            } catch (e) {
                console.error('Error loading translations!', e);
            }
        };
        initI18n();
    }, []);

    if (!i18nInst) {
        return null;
    }

    return (
        <I18nextProvider i18n={i18nInst}>
            {children}
        </I18nextProvider>
    );
};
