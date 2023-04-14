
import React, {useState} from 'react';
import CodeMirror from '@uiw/react-codemirror';
import {githubLight} from '@uiw/codemirror-theme-github';
import {markdown} from '@codemirror/lang-markdown';
import {EditorView} from '@codemirror/view';

import type {MashroomPortalConfigEditorTarget} from '@mashroom/mashroom-portal/type-definitions';

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

    return (
        <div className='mashroom-demo-react-app-2-config-editor'>
            <div className='form-row'>
                <label htmlFor="message">Message (Markdown)</label>
                <CodeMirror
                    value={markdownMessage}
                    height="150px"
                    theme={githubLight}
                    basicSetup={{
                        lineNumbers: false,
                        foldGutter: false,
                        syntaxHighlighting: true,
                        autocompletion: true,
                        closeBrackets: true,
                        highlightActiveLine: false,
                    }}
                    extensions={[
                        markdown(),
                        EditorView.lineWrapping,
                    ]}
                    onChange={setMarkdownMessage}
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
