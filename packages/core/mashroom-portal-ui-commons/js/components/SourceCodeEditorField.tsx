
import React, {PureComponent} from 'react';
import ErrorMessage from './ErrorMessage';
import FieldLabel from './FieldLabel';
import {Controlled as CodeMirror} from 'react-codemirror2'
import 'codemirror/mode/css/css';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/javascript/javascript';

import type {ReactNode} from 'react';
import type {FieldProps} from 'formik';
import type {EditorConfiguration, Editor} from 'codemirror';

type Props = {
    id: string;
    labelId: string,
    language: 'javascript' | 'json' | 'css' | 'html',
    height?: number,
    fieldProps: FieldProps
}

export default class SourceCodeEditorField extends PureComponent<Props> {

    getCodeMirrorOptions(): EditorConfiguration {
        const {language} = this.props;
        let mode = null;
        switch (language) {
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
            theme: 'blackboard',
            lineNumbers: true
        }
    }

    render(): ReactNode {
        const {id, fieldProps: {field, meta}, labelId, height} = this.props;
        const error = meta.touched && !!meta.error;

        return (
            <div id={id} className={`mashroom-portal-ui-source-code-editor-field mashroom-portal-ui-input ${error ? 'error' : ''}`}>
                <FieldLabel labelId={labelId}/>
                <div>
                    <div style={{ height: height || 200, marginBottom: 3 }}>
                        <CodeMirror
                            value={field.value}
                            options={this.getCodeMirrorOptions()}
                            onBeforeChange={(editor, data, value) => {
                                const e = {
                                    target: {
                                        name: field.name,
                                        value,
                                    }
                                };
                                field.onChange(e);
                            }}
                            editorDidMount={(editor: Editor) => {
                                // Necessary to be able to focus erroneous inputs
                                editor.getInputField().name = field.name;

                                // Fixes a problem with the cursor, see https://github.com/codemirror/CodeMirror/issues/5040
                                setTimeout(() => {
                                    editor.refresh();
                                }, 500);
                            }}
                        />
                    </div>
                    {error && <ErrorMessage messageId={meta.error || ''}/>}
                </div>
            </div>
        );
    }

}
