// @flow

import React, {PureComponent} from 'react';
import ErrorMessage from './ErrorMessage';
import FieldLabel from './FieldLabel';
import {Controlled as CodeMirror} from 'react-codemirror2'
import 'codemirror/mode/css/css';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/javascript/javascript';

import type {FieldProps} from 'redux-form';

type Props = {
    labelId: string,
    language: 'javascript' | 'json' | 'css' | 'html',
    theme?: 'blackboard' | 'idea',
    height?: number,
    fieldProps: FieldProps
}

export default class SourceCodeEditorField extends PureComponent<Props> {

    getCodeMirrorOptions() {
        let mode = null;
        switch (this.props.language) {
            case 'json': {
                mode = { name: 'javascript', json: true };
                break;
            }
            case 'css': {
                mode = 'css';
                break;
            }
            case 'html': {
                mode = 'htmlmixed';
                break;
            }
            default:
            case 'javascript': {
                mode = 'javascript';
                break;
            }
        }

        return {
            mode,
            theme: this.props.theme || 'blackboard',
            lineNumbers: true
        }
    }

    render() {
        const error = this.props.fieldProps.meta.touched && !!this.props.fieldProps.meta.error;

        return (
            <div className={`mashroom-portal-ui-source-code-editor-field mashroom-portal-ui-input ${error ? 'error' : ''}`}>
                <FieldLabel labelId={this.props.labelId}/>
                <div style={{ width: '100%', height: this.props.height || 200 }}>
                    <CodeMirror
                        value={this.props.fieldProps.input.value}
                        options={this.getCodeMirrorOptions()}
                        onBeforeChange={(editor, data, value) => {
                            this.props.fieldProps.input.onChange(value);
                        }}
                        onChange={(editor, data, value) => {

                        }}
                        editorDidMount={(editor: any) => {
                            // Fixes a problem with the cursor, see https://github.com/codemirror/CodeMirror/issues/5040
                            setTimeout(() => {
                                editor.refresh();
                            }, 200);
                        }}
                    />
                </div>
                {error && <ErrorMessage messageId={this.props.fieldProps.meta.error || ''}/>}
            </div>
        );
    }

}
