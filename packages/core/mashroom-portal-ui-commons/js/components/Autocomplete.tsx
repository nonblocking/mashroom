
import React, {useEffect, useRef, useState} from 'react';
import AutoSuggest from 'react-autosuggest';
import {useIntl} from 'react-intl';
import FieldLabel from './FieldLabel';
import ErrorMessage from './ErrorMessage';

import type {ReactNode, ChangeEvent, KeyboardEvent} from 'react';
import type {FieldProps} from 'formik';
import type {RenderInputComponentProps, ShouldRenderReasons} from 'react-autosuggest';
import type {SuggestionHandler} from '../../type-definitions';

type Props = {
    id: string;
    labelId: string;
    maxLength?: number;
    placeholder?: string;
    minCharactersForSuggestions?: number;
    mustSelectSuggestion?: boolean;
    suggestionHandler: SuggestionHandler<any>;
    onValueChange?: (value: string | undefined | null) => void;
    onSuggestionSelect?: (suggestion: any) => void;
    fieldProps: FieldProps;
    resetRef?: (ref: () => void) => void;
}

export default ({id, labelId, maxLength, placeholder: placeholderId, minCharactersForSuggestions = 3, mustSelectSuggestion, suggestionHandler, onValueChange, onSuggestionSelect, fieldProps: {meta, field}, resetRef}: Props) => {
    const [value, setValue] = useState(field.value || '');
    const [suggestions, setSuggestions] = useState<Array<any>>([]);
    const intl = useIntl();
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        resetRef?.(() => reset());
    }, []);
    useEffect(() => {
        if (field.value !== value) {
            setValue(field.value || '');
        }
    }, [field.value]);

    const onSuggestionsFetchRequested = ({ value }: {value: string}) => {
        suggestionHandler.getSuggestions(value).then(
            (suggestions) => {
                if (suggestions && Array.isArray(suggestions)) {
                    setSuggestions(suggestions);
                }
            }
        );
    };

    const onSuggestionsClearRequested = () => {
        setSuggestions([]);
    };

    const onSuggestionSelected = (_: any, { suggestion }: {suggestion: any}) => {
        if (onSuggestionSelect) {
            onSuggestionSelect(suggestion);
        }

        const value = suggestionHandler.getSuggestionValue(suggestion);
        simulateFieldChangeEvent(value);
        if (onValueChange) {
            onValueChange(value);
        }
    };

    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setValue(value || '');

        if (!mustSelectSuggestion) {
            simulateFieldChangeEvent(value);
            if (onValueChange) {
                onValueChange(value);
            }
        }
    };

    const onBlur = () => {
        if (mustSelectSuggestion) {
            setTimeout(() => {
                setValue(field.value || '');
            }, 100);
        }
    };

    const simulateFieldChangeEvent = (value: string | undefined | null) => {
        const syntheticEvent = {
            target: {
                name: field.name,
                value,
            }
        };
        field.onChange(syntheticEvent);
    };

    const reset = () => {
        setValue('');
        simulateFieldChangeEvent('');
        if (onValueChange) {
            onValueChange('');
        }
    };

    const shouldRenderSuggestions = (value: string, reason: ShouldRenderReasons) => {
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
    };

    const renderSuggestionsContainer = ({ containerProps, children }: { containerProps: any, children: ReactNode }) => {
        const width = inputRef.current ? inputRef.current.clientWidth : 'auto';
        return (
            <div {...containerProps} style={{ width }}>
                {children}
            </div>
        );
    };

    const renderInputComponent = (inputProps: RenderInputComponentProps) => {
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
    };

    const error = meta.touched && !!meta.error;
    const placeholder = placeholderId ? intl.formatMessage({ id: placeholderId }) : null;
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
                getSuggestionValue={(suggestion: any) => suggestionHandler.getSuggestionValue(suggestion)}
                renderSuggestion={(suggestion: any, {query, isHighlighted}) => suggestionHandler.renderSuggestion(suggestion, isHighlighted, query)}
                onSuggestionSelected={onSuggestionSelected.bind(this)}
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
