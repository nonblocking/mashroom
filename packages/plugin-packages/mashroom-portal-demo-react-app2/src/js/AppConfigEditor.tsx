
import React, {useState} from 'react';
import Markdown from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';

import type {MashroomPortalConfigEditorTarget} from '@mashroom/mashroom-portal/type-definitions';

const markdown = new Markdown();

type Props = {
    editorTarget: MashroomPortalConfigEditorTarget;
}

const saveAndClose = (markdownMessage: string, pingButtonLabel: string, updateAppConfig: (appConfig: any) => void, close: () => void) => {
    updateAppConfig({
        markdownMessage,
        pingButtonLabel,
    });
    close();
}

export default ({editorTarget: {appConfig, updateAppConfig, close}}: Props) => {
    const [markdownMessage, setMarkdownMessage] = useState(appConfig.markdownMessage || '');
    const [pingButtonLabel, setPingButtonLabel] = useState(appConfig.pingButtonLabel || '');

    return (
        <div className='mashroom-demo-react-app-2-config-editor'>
            <div className='form-row'>
                <label htmlFor="message">Message</label>
                <MdEditor
                    renderHTML={text => markdown.render(text)}
                    value={markdownMessage}
                    onChange={({text}) => setMarkdownMessage(text)}
                    view={{ menu: true, md: true, html: false }}
                    allowPasteImage={false}
                />
            </div>
            <div className='form-row'>
                <label htmlFor="buttonLabel">Button Label</label>
                <input id="buttonLabel" type="text" value={pingButtonLabel} onChange={(e) => setPingButtonLabel(e.target.value)}/>
            </div>
            <div className="button-row">
                <button onClick={() => saveAndClose(markdownMessage, pingButtonLabel, updateAppConfig, close)}>Save</button>
                <a href="javascript:void(0)" onClick={() => close()}>Cancel</a>
            </div>
        </div>
    );
};
