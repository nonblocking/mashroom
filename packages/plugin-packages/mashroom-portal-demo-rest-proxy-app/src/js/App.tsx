
import React, {PureComponent} from 'react';
import {IntlProvider} from 'react-intl';
import messages from '../messages/messages';
import SpaceXLaunches from './SpaceXLaunches';

type Props = {
    lang: string;
    spaceXApiPath: string;
}

export default class App extends PureComponent<Props> {

    render() {
        let lang = this.props.lang;
        if (!messages[lang]) {
            lang = 'en';
        }

        return (
            <IntlProvider messages={messages[lang]} locale={lang}>
                <div className='mashroom-demo-rest-proxy-app'>
                    <SpaceXLaunches spaceXApiPath={this.props.spaceXApiPath}/>
                </div>
            </IntlProvider>
        );
    }

}
