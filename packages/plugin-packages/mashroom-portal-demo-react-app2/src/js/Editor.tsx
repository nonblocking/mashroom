
import React, {useState} from 'react';
import Markdown from 'markdown-it';
import ReactMde from 'react-mde';

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
};

export default ({editorTarget: {appConfig, updateAppConfig, close}}: Props) => {
    const [markdownMessage, setMarkdownMessage] = useState(appConfig.markdownMessage || '');
    const [pingButtonLabel, setPingButtonLabel] = useState(appConfig.pingButtonLabel || '');
    const [selectedTab, setSelectedTab] = useState<'write' | 'preview'>('write');

    return (
        <div className='mashroom-demo-react-app-2-config-editor'>
            <div className='form-row'>
                <label htmlFor="message">Message</label>
                <ReactMde
                    toolbarCommands={[['bold', 'italic', 'strikethrough'], ['link', 'image'], ['unordered-list', 'ordered-list']]}
                    getIcon={(iconName) => <span className={`icon-${iconName}`}/>}
                    generateMarkdownPreview={(md) => Promise.resolve(markdown.render(md))}
                    value={markdownMessage}
                    onChange={setMarkdownMessage}
                    selectedTab={selectedTab}
                    onTabChange={setSelectedTab}
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
