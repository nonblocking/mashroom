
import React, {useCallback, useEffect, useRef, useState} from 'react';
import AutoSuggest from 'react-autosuggest';
import {useTranslation} from 'react-i18next';
import {useField} from 'formik';
import FieldLabel from './FieldLabel';
import ErrorMessage from './ErrorMessage';

import type {ReactNode, ChangeEvent, KeyboardEvent} from 'react';
import type {RenderInputComponentProps, ShouldRenderReasons} from 'react-autosuggest';
import type {SuggestionHandler} from '../../type-definitions';

type Props = {
    name: string;
    id: string;
    labelId: string;
    maxLength?: number;
    placeholder?: string;
    minCharactersForSuggestions?: number;
    mustSelectSuggestion?: boolean;
    suggestionHandler: SuggestionHandler<any>;
    onValueChange?: (value: string | undefined | null) => void;
    onSuggestionSelect?: (suggestion: any) => void;
    resetRef?: (ref: () => void) => void;
}

export default ({name, id, labelId, maxLength, placeholder: placeholderId, minCharactersForSuggestions = 3, mustSelectSuggestion, suggestionHandler, onValueChange, onSuggestionSelect, resetRef}: Props) => {
    const [field, meta] = useField(name);
    const [value, setValue] = useState(field.value || '');
    const [suggestions, setSuggestions] = useState<Array<any>>([]);
    const {t} = useTranslation();
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        resetRef?.(() => reset());
    }, []);

    useEffect(() => {
        if (field.value !== value) {
            setValue(field.value || '');
        }
    }, [field.value]);

    const simulateFieldChangeEvent = (value: string | undefined | null) => {
        const syntheticEvent = {
            target: {
                name: field.name,
                value,
            }
        };
        field.onChange(syntheticEvent);
    };

    const onSuggestionsFetchRequested = useCallback(async ({ value }: {value: string}) => {
        const suggestions = await suggestionHandler.getSuggestions(value);
        if (suggestions && Array.isArray(suggestions)) {
            setSuggestions(suggestions);
        }
    }, [suggestionHandler]);

    const onSuggestionsClearRequested = useCallback(() => {
        setSuggestions([]);
    }, []);

    const onSuggestionSelected = useCallback((_: any, { suggestion }: {suggestion: any}) => {
        if (onSuggestionSelect) {
            onSuggestionSelect(suggestion);
        }

        const value = suggestionHandler.getSuggestionValue(suggestion);
        simulateFieldChangeEvent(value);
        if (onValueChange) {
            onValueChange(value);
        }
    }, [onSuggestionSelect, suggestionHandler, onValueChange]);

    const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setValue(value || '');

        if (!mustSelectSuggestion) {
            simulateFieldChangeEvent(value);
            if (onValueChange) {
                onValueChange(value);
            }
        }
    }, [mustSelectSuggestion, onValueChange]);

    const onBlur = useCallback(() => {
        if (mustSelectSuggestion) {
            setTimeout(() => {
                setValue(field.value || '');
            }, 100);
        }
    }, [mustSelectSuggestion]);

    const reset = useCallback(() => {
        setValue('');
        simulateFieldChangeEvent('');
        if (onValueChange) {
            onValueChange('');
        }
    }, [onValueChange]);

    const shouldRenderSuggestions = useCallback((value: string, reason: ShouldRenderReasons) => {
        switch (reason) {
        case 'input-focused':
            return minCharactersForSuggestions === 0;
        case 'input-changed':
        case 'render':
            return (value || '').trim().length >= minCharactersForSuggestions;
        case 'input-blurred':
        case 'escape-pressed':
            return true;
        default:
            return false;
        }
    }, []);

    const renderSuggestionsContainer = useCallback(({ containerProps, children }: { containerProps: any, children: ReactNode }) => {
        const width = inputRef.current ? inputRef.current.clientWidth : 'auto';
        return (
            <div {...containerProps} style={{ width }}>
                {children}
            </div>
        );
    }, []);

    const renderInputComponent = useCallback((inputProps: RenderInputComponentProps) => {
        const mergedInputProps = {
            ...inputProps,
            onKeyDown(e: KeyboardEvent<any>) {
                // Ignore enter (could submit the form)
                if (e.key === 'Enter') {
                    e.preventDefault();
                }
                if (inputProps.onKeyDown) {
                    inputProps.onKeyDown(e);
                }
            },
            ref(elem: HTMLInputElement) {
                inputRef.current = elem;
                if (inputProps.ref) {
                    // @ts-ignore
                    inputProps.ref(elem);
                }
            }
        };
        return (
            <input {...mergedInputProps} />
        );
    }, []);

    const getSuggestionValue = useCallback((suggestion: any) => {
        return suggestionHandler.getSuggestionValue(suggestion);
    }, [suggestionHandler]);

    const renderSuggestion = useCallback((suggestion: any, {query, isHighlighted}: {query: string, isHighlighted: boolean}) => {
        return suggestionHandler.renderSuggestion(suggestion, isHighlighted, query);
    }, [suggestionHandler]);

    const error = meta.touched && !!meta.error;
    const placeholder = placeholderId ? t(placeholderId) : null;
    const inputProps: any = {
        ...field,
        type: 'search',
        value,
        onChange,
        onBlur,
        placeholder,
        maxLength
    };

    return (
        <div className={`mashroom-portal-autocomplete-field mashroom-portal-ui-input ${error ? 'error' : ''}`}>
            <FieldLabel htmlFor={id} labelId={labelId}/>
            <AutoSuggest
                suggestions={suggestions}
                onSuggestionsFetchRequested={onSuggestionsFetchRequested}
                onSuggestionsClearRequested={onSuggestionsClearRequested}
                getSuggestionValue={getSuggestionValue}
                renderSuggestion={renderSuggestion}
                onSuggestionSelected={onSuggestionSelected}
                inputProps={inputProps}
                renderInputComponent={renderInputComponent}
                renderSuggestionsContainer={renderSuggestionsContainer}
                shouldRenderSuggestions={shouldRenderSuggestions}
                theme={{
                    container: 'autocomplete-container',
                    containerOpen: 'autocomplete-container-open',
                    suggestionsContainer: 'suggestions-container',
                    suggestionsContainerOpen: 'suggestions-container-open',
                    suggestionsList: 'suggestions-list',
                    suggestion: 'suggestion-list-item',
                }}
            />
            {error && <ErrorMessage messageId={meta.error || ''}/>}
        </div>
    );
};
