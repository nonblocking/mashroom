
import React, {PureComponent} from 'react';
import {ErrorMessage, FieldLabel} from '@mashroom/mashroom-portal-ui-commons';

import type {ReactNode} from 'react';
import type {FieldProps} from 'formik';
import type {I18NString} from '@mashroom/mashroom/type-definitions';
import type {Languages} from '../types';

type Props = {
    id: string,
    labelId: string,
    languages: Languages,
    fieldProps: FieldProps
}

export default class I18NStringField extends PureComponent<Props> {

    getValue(): Record<string, string> {
        const {fieldProps: {field}, languages} = this.props;
        let val: I18NString = field.value;
        if (typeof (val) === 'string') {
            val = {
                [languages.default]: val
            };
        }

        return val || {
            [languages.default]: ''
        };
    }

    onValueChange(lang: string, value: string | undefined | null): void {
        const val = {...this.getValue(), [lang]: value};
        this.simulateFieldChangeEvent(val);
    }

    simulateFieldChangeEvent(value: any) {
        const {fieldProps: {field}} = this.props;
        const e = {
            target: {
                name: field.name,
                value,
            }
        };
        field.onChange(e);
    }

    onBlur() {
        const {fieldProps: {field}} = this.props;
        const e = {
            target: {
                name: field.name,
            }
        };
        field.onBlur(e);
    }

    onAddLang(lang: string) {
        const val = {...this.getValue(), [lang]: ''};
        this.simulateFieldChangeEvent(val);
    }

    onRemoveLang(lang: string) {
        const val = {...this.getValue()};
        delete val[lang];
        this.simulateFieldChangeEvent(val);
    }

    renderInputs() {
        const {fieldProps: {field}, languages} = this.props;
        const val = this.getValue();
        const inputs = [];
        inputs.push(
            <input key='default-lang' type='text'
                   name={field.name}
                   value={val[languages.default]}
                   onChange={(e) => this.onValueChange(languages.default, e.target.value)}
                   onBlur={this.onBlur.bind(this)}
            />
        );

        let availableLanguages = [...languages.available];
        availableLanguages = availableLanguages.filter((l) => l !== languages.default);
        for (const lang of languages.available) {
            if (lang === languages.default) {
                continue;
            }
            if (typeof (val[lang]) !== 'undefined') {
                inputs.push(
                    <div key={lang} className='translation'>
                        <div className='lang'>{lang}:</div>
                        <input type='text'
                               name={`${field.name}.${lang}`}
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
        const {id, labelId, fieldProps: {meta}} = this.props;
        const error = meta.touched && !!meta.error;

        return (
            <div className={`i18nstring-field mashroom-portal-ui-input ${error ? 'error' : ''}`}>
                <FieldLabel htmlFor={id} labelId={labelId}/>
                <div>
                    {this.renderInputs()}
                    {error && <ErrorMessage messageId={meta.error || ''}/>}
                </div>
            </div>
        );
    }
}

