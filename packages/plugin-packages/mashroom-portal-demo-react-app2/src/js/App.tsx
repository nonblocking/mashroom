
import React, {useState, useCallback, useMemo, useEffect} from 'react';
import Markdown from 'markdown-it';
import ReactLogo from '../assets/React-icon.svg';
import InlineSVG from './InlineSVG';

import type {MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions';

const markdown = new Markdown();

type Props = {
    markdownMessage?: string;
    pingButtonLabel?: string;
    messageBus: MashroomPortalMessageBus;
}

export default ({markdownMessage, pingButtonLabel, messageBus}: Props) => {
    const [pings, setPings] = useState(0);
    const pingReceiver = useCallback(() => setPings((p) => p + 1), []);
    const message = useMemo(() => markdown.render(markdownMessage || 'Hello World'), [markdownMessage]);
    useEffect(() => {
        messageBus.subscribe('ping', pingReceiver);
        return () => {
            messageBus.unsubscribe('ping', pingReceiver);
        };
    }, [messageBus]);

    return (
        <div className='mashroom-demo-react-app-2'>
            <InlineSVG className='react-logo' svgData={ReactLogo}/>
            <div className="demo-react-app-content">
                <h4>React Demo App</h4>
                <div dangerouslySetInnerHTML={{__html: message }} />
                <div>
                    <button onClick={() => messageBus.publish('ping', {})}>
                        {pingButtonLabel || 'Send Ping'}
                    </button>
                    <span>Received pings: {pings}</span>
                </div>
            </div>
        </div>
    );
};
