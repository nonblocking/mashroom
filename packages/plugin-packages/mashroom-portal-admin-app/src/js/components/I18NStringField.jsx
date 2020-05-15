// @flow

import React, {PureComponent} from 'react';
import {ErrorMessage, FieldLabel} from '@mashroom/mashroom-portal-ui-commons';

import type {FieldProps} from 'redux-form';
import type {I18NString} from '@mashroom/mashroom/type-definitions';
import type {Languages} from '../../../type-definitions';

type Props = {
    id: string,
    labelId: string,
    languages: Languages,
    fieldProps: FieldProps
}

export default class I18NStringField extends PureComponent<Props> {

    getValue(): { [string]: string } {
        let val: I18NString = this.props.fieldProps.input.value;
        if (typeof (val) === 'string') {
            val = {
                [this.props.languages.default]: val
            }
        }

        return val || {
            [this.props.languages.default]: ''
        };
    }

    onValueChange(lang: string, value: ?string) {
        const val = {...this.getValue(), [lang]: value};

        this.props.fieldProps.input.onChange(val);
    }

    onBlur() {
        this.props.fieldProps.input.onBlur();
    }

    onAddLang(lang: string) {
        const val = {...this.getValue(), [lang]: ''};

        this.props.fieldProps.input.onChange(val);
    }

    onRemoveLang(lang: string) {
        const val = {...this.getValue()};
        delete val[lang];

        this.props.fieldProps.input.onChange(val);
    }

    renderInputs() {
        const val = this.getValue();
        const inputs = [];
        inputs.push(
            <input key='default-lang' type='text'
                   name={this.props.fieldProps.input.name}
                   value={val[this.props.languages.default]}
                   onChange={(e) => this.onValueChange(this.props.languages.default, e.target.value)}
                   onBlur={this.onBlur.bind(this)}
            />
        );

        let availableLanguages = [...this.props.languages.available];
        availableLanguages = availableLanguages.filter((l) => l !== this.props.languages.default);
        for (const lang of this.props.languages.available) {
            if (lang === this.props.languages.default) {
                continue;
            }
            if (typeof (val[lang]) !== 'undefined') {
                inputs.push(
                    <div key={lang} className='translation'>
                        <div className='lang'>{lang}:</div>
                        <input type='text'
                               name={`${this.props.fieldProps.input.name}.${lang}`}
                               value={val[lang]}
                               onChange={(e) => this.onValueChange(lang, e.target.value)}
                               onBlur={this.onBlur.bind(this)}
                        />
                        <div className='remove' onClick={this.onRemoveLang.bind(this, lang)}>&nbsp;</div>
                    </div>
                );
                availableLanguages = availableLanguages.filter((l) => l !== lang);
            }
        }

        if (availableLanguages.length >= 0) {
            inputs.push(
                <div key='available-languages' className='available-languages'>
                    {availableLanguages.map((lang) => (
                        <span key={lang} className='add-language'
                              onClick={this.onAddLang.bind(this, lang)}>{lang}</span>
                    ))}
                </div>
            );
        }

        return (
            <div className='i18n-field-inputs'>
                {inputs}
            </div>
        );
    }

    render() {
        const error = this.props.fieldProps.meta.touched && !!this.props.fieldProps.meta.error;

        return (
            <div className={`i18nstring-field mashroom-portal-ui-input ${error ? 'error' : ''}`}>
                <FieldLabel htmlFor={this.props.id} labelId={this.props.labelId}/>
                <div>
                    {this.renderInputs()}
                    {error && <ErrorMessage messageId={this.props.fieldProps.meta.error || ''}/>}
                </div>
            </div>
        );
    }
}

