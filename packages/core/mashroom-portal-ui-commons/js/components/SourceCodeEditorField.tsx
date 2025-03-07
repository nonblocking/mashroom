
import React, {PureComponent, createRef, type RefObject} from 'react';
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

export default class SourceCodeEditorField extends PureComponent<Props> {

    cmRef: RefObject<ReactCodeMirrorRef>;

    constructor(props: Props) {
        super(props);
        this.cmRef = createRef();
    }

    componentDidUpdate(prevProps: Readonly<Props>) {
        const prevValue = prevProps.fieldProps.field.value;
        const newValue = this.props.fieldProps.field.value;

        if (newValue !== prevValue && this.cmRef.current?.view?.state && this.cmRef.current.view.state.doc.toString() !== newValue) {
            // Apply external changes
            this.cmRef.current.view.state.update({changes: {from: 0, to: this.cmRef.current.view.state.doc.length, insert: newValue}});
        }
    }

    render() {
        const {id, fieldProps: {field, meta}, labelId, height, language, theme} = this.props;
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
                            ref={this.cmRef}
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
    }

}
