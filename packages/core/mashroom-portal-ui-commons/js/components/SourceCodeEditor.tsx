
import React, {useRef, useEffect} from 'react';
import CodeMirror, {type ReactCodeMirrorRef} from '@uiw/react-codemirror';
import {githubDark, githubLight} from '@uiw/codemirror-theme-github';
import {json} from '@codemirror/lang-json';
import {css} from '@codemirror/lang-css';
import ErrorMessage from './ErrorMessage';
import FieldLabel from './FieldLabel';

import type {FieldProps} from 'formik';

type Props = {
    id: string;
    labelId: string,
    language: 'json' | 'css',
    height?: number,
    theme?: 'light' | 'dark';
    fieldProps: FieldProps
}

export default ({id, labelId, language, height, theme, fieldProps: {field, meta}}: Props) => {
    const cmRef = useRef<ReactCodeMirrorRef | null>(null);

    useEffect(() => {
        if (cmRef.current?.view) {
            if (field.value !== cmRef.current.view.state.doc.toString()) {
                // Apply external changes
                cmRef.current.view.state.update({changes: {from: 0, to: cmRef.current.view.state.doc.length, insert: field.value}});
            }
        }
    }, [field.value]);

    const extensions = [];
    switch (language) {
    case 'css':
        extensions.push(css());
        break;
    case 'json':
        extensions.push(json());
        break;
    }

    const error = meta.touched && !!meta.error;

    return (
        <div id={id} className={`mashroom-portal-ui-source-code-editor-field mashroom-portal-ui-input ${error ? 'error' : ''}`}>
            <FieldLabel labelId={labelId}/>
            <div>
                <div style={{ height: height || 200, marginBottom: 3 }}>
                    <CodeMirror
                        ref={cmRef}
                        value={field.value}
                        height={height ? `${height}px` : 'auto'}
                        theme={theme === 'dark' || (window as any).__MASHROOM_PORTAL_DARK_MODE__ ? githubDark : githubLight}
                        basicSetup={{
                            lineNumbers: false,
                            foldGutter: false,
                            syntaxHighlighting: true,
                            autocompletion: true,
                            closeBrackets: true,
                            highlightActiveLine: false,
                        }}
                        extensions={extensions}
                        onBlur={field.onBlur}
                        onChange={(value) => {
                            const e = {
                                target: {
                                    name: field.name,
                                    value,
                                }
                            };
                            field.onChange(e);
                        }}
                    />
                </div>
                {error && <ErrorMessage messageId={meta.error || ''}/>}
            </div>
        </div>
    );
};
