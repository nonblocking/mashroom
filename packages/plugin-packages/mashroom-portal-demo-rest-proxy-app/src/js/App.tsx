
import React from 'react';
import {IntlProvider} from 'react-intl';
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

    return (
        <IntlProvider messages={messages[lang]} locale={lang}>
            <div className='mashroom-demo-rest-proxy-app'>
                <RocketLaunches rocketLaunchApi={rocketLaunchApi}/>
            </div>
        </IntlProvider>
    );
};
