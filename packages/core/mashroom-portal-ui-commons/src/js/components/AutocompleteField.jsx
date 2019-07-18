// @flow

import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';
import AutoSuggest from 'react-autosuggest';
import FieldLabel from './FieldLabel';

import type {Node} from 'react';
import type {FieldProps} from 'redux-form';
import type {IntlShape} from 'react-intl';
import type {SuggestionHandler} from '../../../type-definitions';

type Props = {
    id: string,
    labelId: string,
    maxLength?: number,
    placeholder?: string,
    minCharactersForSuggestions?: number,
    mustSelectSuggestion?: boolean,
    suggestionHandler: SuggestionHandler<*>,
    onValueChange?: (value: ?string) => void,
    onSuggestionSelect?: (any) => void,
    fieldProps: FieldProps,
    intl: IntlShape
}

type State = {
    value: ?string,
    suggestions: Array<any>;
}

export default class AutocompleteField extends PureComponent<Props, State> {

    inputRef: HTMLInputElement;

    constructor() {
        super();
        this.state = {
            value: '',
            suggestions: []
        };
    }

    static getDerivedStateFromProps(props: Props, state: State) {
        return {
            value: props.fieldProps.input.value
        }
    }

    onSuggestionsFetchRequested({ value }: { value: string }) {
        this.props.suggestionHandler.getSuggestions(value).then(
            (suggestions) => {
                if (suggestions && Array.isArray(suggestions)) {
                    this.setState({
                        suggestions
                    });
                }
            }
        )
    }

    onSuggestionsClearRequested() {
        this.setState({
            suggestions: []
        });
    }

    onSuggestionSelected(event: any, { suggestion }: any) {
        this.props.onSuggestionSelect && this.props.onSuggestionSelect(suggestion);
        this.props.fieldProps.input.onChange(suggestion);
        if (this.props.onValueChange) {
            this.props.onValueChange(suggestion);
        }
    }

    onValueChange(value: ?string) {
        this.setState({
            value
        });

        if (!this.props.mustSelectSuggestion) {
            this.props.fieldProps.input.onChange(value);
            if (this.props.onValueChange) {
                this.props.onValueChange(value);
            }
        }
    }

    shouldRenderSuggestions(value?: string) {
        if (!value) {
            return false;
        }
        const minCharactersForSuggestions = this.props.minCharactersForSuggestions;
        if (!minCharactersForSuggestions) {
            return true;
        }
        return value.trim().length >= minCharactersForSuggestions;
    }

    renderSuggestionsContainer({ containerProps, children }: { containerProps: any, children: Node }) {
        const width = this.inputRef ? this.inputRef.clientWidth : 'auto';

        return (
            <div {...containerProps} style={{ width }}>
                {children}
            </div>
        );
    }

    renderInputComponent(inputProps: any) {
        const outerThis = this;
        const mergedInputProps = Object.assign({}, inputProps, {
            onKeyDown(e: KeyboardEvent) {
                // Ignore enter (could submit the form)
                if (e.key === 'Enter') {
                    e.preventDefault();
                }
                if (inputProps.onKeyDown) {
                    inputProps.onKeyDown(e);
                }
            },
            ref(elem) {
                outerThis.inputRef = elem;
                if (inputProps.ref) {
                    inputProps.ref(elem);
                }
            }
        });

        return (
            <input {...mergedInputProps} />
        );
    }

    render() {
        const error = this.props.fieldProps.meta.touched && !!this.props.fieldProps.meta.error;

        const placeholder = this.props.placeholder ? this.props.intl.formatMessage({ id: this.props.placeholder }) : null;
        const inputProps = Object.assign({}, this.props.fieldProps.input, {
            type: 'search',
            value: this.state.value,
            onChange: (e) => this.onValueChange(e.target.value),
            placeholder,
            maxLength: this.props.maxLength
        });

        return (
            <div className={`mashroom-portal-autocomplete-field ${error ? 'error' : ''}`}>
                <FieldLabel htmlFor={this.props.id} labelId={this.props.labelId}/>
                <AutoSuggest
                    suggestions={this.state.suggestions}
                    onSuggestionsFetchRequested={this.onSuggestionsFetchRequested.bind(this)}
                    onSuggestionsClearRequested={this.onSuggestionsClearRequested.bind(this)}
                    getSuggestionValue={(suggestion) => this.props.suggestionHandler.getSuggestionValue(suggestion)}
                    renderSuggestion={(suggestion, {query, isHighlighted}) => this.props.suggestionHandler.renderSuggestion(suggestion, isHighlighted, query)}
                    onSuggestionSelected={this.onSuggestionSelected.bind(this)}
                    inputProps={inputProps}
                    renderInputComponent={this.renderInputComponent.bind(this)}
                    renderSuggestionsContainer={this.renderSuggestionsContainer.bind(this)}
                    shouldRenderSuggestions={this.shouldRenderSuggestions.bind(this)}
                    theme={{
                        container: 'autocomplete-container',
                        containerOpen: 'autocomplete-container-open',
                        suggestionsContainer: 'suggestions-container',
                        suggestionsContainerOpen: 'suggestions-container-open',
                        suggestionsList: 'suggestions-list',
                        suggestion: 'suggestion-list-item',
                    }}
                />
                {error && <div className='error-message'><FormattedMessage id={this.props.fieldProps.meta.error || ''}/></div>}
            </div>
        );
    }

}

