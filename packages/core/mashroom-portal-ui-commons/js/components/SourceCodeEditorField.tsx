
import React, {PureComponent, createRef, type RefObject} from 'react';
import {tags as t} from '@lezer/highlight';
import CodeMirror, {type ReactCodeMirrorRef} from '@uiw/react-codemirror';
import {createTheme} from '@uiw/codemirror-themes';
import {json} from '@codemirror/lang-json';
import {css} from '@codemirror/lang-css';
import ErrorMessage from './ErrorMessage';
import FieldLabel from './FieldLabel';

import type {ReactNode} from 'react';
import type {FieldProps} from 'formik';

const theme = createTheme({
    theme: 'dark',
    settings: {
        background: '#464844',
        foreground: '#FFFFFF',
        caret: '#FFFFFF',
        selection: '#666',
        selectionMatch: '#666',
        lineHighlight: '#464844',
    },
    styles: [
        {tag: [t.comment, t.documentMeta], color: '#8292a2'},
        {tag: [t.number, t.bool, t.null, t.atom], color: '#ae81ff'},
        {tag: [t.attributeValue, t.className, t.name], color: '#e6db74'},
        {tag: [t.propertyName, t.attributeName], color: '#a6e22e'},
        {tag: [t.variableName], color: '#9effff'},
        {tag: [t.squareBracket], color: '#bababa'},
        {tag: [t.string, t.special(t.brace)], color: '#e6db74'},
        {tag: [t.regexp, t.className, t.typeName, t.definition(t.typeName)], color: '#66d9ef'},
        {tag: [t.definition(t.variableName), t.definition(t.propertyName), t.function(t.variableName)], color: '#fd971f'},
        {tag: [t.keyword, t.definitionKeyword, t.modifier, t.tagName, t.angleBracket], color: '#f92672'},
    ],
});


type Props = {
    id: string;
    labelId: string,
    language: 'json' | 'css',
    height?: number,
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

    render(): ReactNode {
        const {id, fieldProps: {field, meta}, labelId, height, language} = this.props;
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
                            theme={theme}
                            basicSetup={{
                                lineNumbers: false,
                                foldGutter: false,
                                syntaxHighlighting: true,
                                autocompletion: true,
                                closeBrackets: true,
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
