
import React, {PureComponent} from 'react';
import AutoSuggest from 'react-autosuggest';
import FieldLabel from './FieldLabel';
import ErrorMessage from './ErrorMessage';

import type {ReactNode, ChangeEvent} from 'react';
import type {WrappedFieldProps} from 'redux-form';
import type {IntlShape} from 'react-intl';
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
    fieldProps: WrappedFieldProps;
    resetRef?: (ref: () => void) => void;
    intl: IntlShape;
}

type State = {
    value: string | undefined | null;
    suggestions: Array<any>;
}

export default class AutocompleteField extends PureComponent<Props, State> {

    inputRef: HTMLInputElement | undefined;

    constructor(props: Props) {
        super(props);
        if (props.resetRef) {
            props.resetRef(() => this.reset());
        }
        this.state = {
            value: '',
            suggestions: []
        };
    }

    static getDerivedStateFromProps(props: Props) {
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

    onValueChange(value: string | undefined | null) {
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

    reset() {
        this.setState({
            value: '',
        });
        this.props.fieldProps.input.onChange('');
        if (this.props.onValueChange) {
            this.props.onValueChange('');
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

    renderSuggestionsContainer({ containerProps, children }: { containerProps: any, children: ReactNode }) {
        const width = this.inputRef ? this.inputRef.clientWidth : 'auto';

        return (
            <div {...containerProps} style={{ width }}>
                {children}
            </div>
        );
    }

    renderInputComponent(inputProps: any) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const outerThis = this;
        const mergedInputProps = {
            ...inputProps,
            onKeyDown(e: KeyboardEvent) {
                // Ignore enter (could submit the form)
                if (e.key === 'Enter') {
                    e.preventDefault();
                }
                if (inputProps.onKeyDown) {
                    inputProps.onKeyDown(e);
                }
            },
            ref(elem: HTMLInputElement) {
                outerThis.inputRef = elem;
                if (inputProps.ref) {
                    inputProps.ref(elem);
                }
            },
            onChange(e: ChangeEvent<HTMLInputElement>) {
                const cursor = e.target.selectionStart;
                inputProps.onChange(e);
                // Prevent the cursor from jumping to the end
                // This is just a quick fix, the actual problem seems to be a bug in react-autosuggest or redux-form
                // TODO: investigate
                setTimeout(() => {
                    e.target.selectionStart = cursor;
                    e.target.selectionEnd = cursor;
                }, 0);
            },
        };

        return (
            <input {...mergedInputProps} />
        );
    }

    render() {
        const error = this.props.fieldProps.meta.touched && !!this.props.fieldProps.meta.error;

        const placeholder = this.props.placeholder ? this.props.intl.formatMessage({ id: this.props.placeholder }) : null;
        const inputProps: any = {
            ...this.props.fieldProps.input,
            type: 'search',
            value: this.state.value,
            onChange: (e: ChangeEvent<HTMLInputElement>) => this.onValueChange(e.target.value),
            placeholder,
            maxLength: this.props.maxLength};

        return (
            <div className={`mashroom-portal-autocomplete-field mashroom-portal-ui-input ${error ? 'error' : ''}`}>
                <FieldLabel htmlFor={this.props.id} labelId={this.props.labelId}/>
                <AutoSuggest
                    suggestions={this.state.suggestions}
                    onSuggestionsFetchRequested={this.onSuggestionsFetchRequested.bind(this)}
                    onSuggestionsClearRequested={this.onSuggestionsClearRequested.bind(this)}
                    getSuggestionValue={(suggestion: any) => this.props.suggestionHandler.getSuggestionValue(suggestion)}
                    renderSuggestion={(suggestion: any, {query, isHighlighted}) => this.props.suggestionHandler.renderSuggestion(suggestion, isHighlighted, query)}
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
                {error && <ErrorMessage messageId={this.props.fieldProps.meta.error || ''}/>}
            </div>
        );
    }

}

