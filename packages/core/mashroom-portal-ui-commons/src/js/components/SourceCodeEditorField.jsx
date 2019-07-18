// @flow

import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';
import FieldLabel from './FieldLabel';
import {Controlled as CodeMirror} from 'react-codemirror2'
import 'codemirror/mode/css/css';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/javascript/javascript';

import type {FieldProps} from 'redux-form';

type Props = {
    labelId: string,
    language: 'javascript' | 'json' | 'css' | 'html',
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
            theme: 'blackboard',
            lineNumbers: true
        }
    }

    render() {
        const error = this.props.fieldProps.meta.touched && !!this.props.fieldProps.meta.error;

        return (
            <div className={`mashroom-portal-ui-source-code-editor-field ${error ? 'error' : ''}`}>
                <FieldLabel labelId={this.props.labelId}/>
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
                {error && <div className='error-message'><FormattedMessage id={this.props.fieldProps.meta.error || ''}/></div>}
            </div>
        );
    }

}
