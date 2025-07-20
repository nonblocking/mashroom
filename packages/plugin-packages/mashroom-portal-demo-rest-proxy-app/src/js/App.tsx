
import React, {useMemo} from 'react';
import i18nNext from 'i18next';
import {I18nextProvider, initReactI18next} from 'react-i18next';
import messages from '../messages/messages';
import RocketLaunches from './RocketLaunches';

type Props = {
    lang: string;
    rocketLaunchApi: string;
}

export default ({lang, rocketLaunchApi}: Props) => {
    if (!messages[lang]) {
        lang = 'en';
    }

    const i18n = useMemo(() => {
        const inst = i18nNext.createInstance();
        inst.use(initReactI18next)
            .init({
                lng: lang,
                resources: {
                    [lang]: {
                        translation: messages[lang],
                    },
                }
            });
        return inst;
    }, []);

    return (
        <I18nextProvider i18n={i18n}>
            <div className='mashroom-demo-rest-proxy-app'>
                <RocketLaunches rocketLaunchApi={rocketLaunchApi}/>
            </div>
        </I18nextProvider>
    );
};
