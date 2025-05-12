
import React, {useRef, useEffect, useCallback, useMemo} from 'react';
import CodeMirror, {type ReactCodeMirrorRef} from '@uiw/react-codemirror';
import {githubDark, githubLight} from '@uiw/codemirror-theme-github';
import {json} from '@codemirror/lang-json';
import {css} from '@codemirror/lang-css';
import {useField} from 'formik';
import ErrorMessage from './ErrorMessage';
import FieldLabel from './FieldLabel';

type Props = {
    id: string;
    name: string;
    labelId: string,
    language: 'json' | 'css',
    height?: number,
    theme?: 'light' | 'dark';
}

export default ({id, name, labelId, language, height, theme}: Props) => {
    const [field, meta] = useField(name);
    const cmRef = useRef<ReactCodeMirrorRef | null>(null);

    useEffect(() => {
        if (cmRef.current?.view) {
            if (field.value !== cmRef.current.view.state.doc.toString()) {
                // Apply external changes
                cmRef.current.view.state.update({changes: {from: 0, to: cmRef.current.view.state.doc.length, insert: field.value}});
            }
        }
    }, [field.value]);

    const codeMirrorTheme = useMemo(() => {
        return theme === 'dark' || (window as any).__MASHROOM_PORTAL_DARK_MODE__ ? githubDark : githubLight;
    }, [theme]);

    const onChange = useCallback((value: string) => {
        const e = {
            target: {
                name: field.name,
                value,
            }
        };
        field.onChange(e);
    }, [field]);

    const error = meta.touched && !!meta.error;
    const extensions = [];
    switch (language) {
    case 'css':
        extensions.push(css());
        break;
    case 'json':
        extensions.push(json());
        break;
    }

    return (
        <div id={id} className={`mashroom-portal-ui-source-code-editor-field mashroom-portal-ui-input ${error ? 'error' : ''}`}>
            <FieldLabel labelId={labelId}/>
            <div>
                <div style={{ height: height || 200, marginBottom: 3 }}>
                    <CodeMirror
                        ref={cmRef}
                        id={id}
                        value={field.value}
                        height={height ? `${height}px` : 'auto'}
                        theme={codeMirrorTheme}
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
                        onChange={onChange}
                    />
                </div>
                {error && <ErrorMessage messageId={meta.error || ''}/>}
            </div>
        </div>
    );
};
