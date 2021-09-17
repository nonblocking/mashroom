
import React, {PureComponent} from 'react';
import AutoSuggest from 'react-autosuggest';
import FieldLabel from './FieldLabel';
import ErrorMessage from './ErrorMessage';

import type {ReactNode, ChangeEvent, KeyboardEvent} from 'react';
import type {FieldProps} from 'formik';
import type {RenderInputComponentProps, ShouldRenderReasons} from 'react-autosuggest';
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
    fieldProps: FieldProps;
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

    componentDidUpdate(prevProps: Readonly<Props>): void {
        const {fieldProps: {field}} = this.props;
        if (field.value !== prevProps.fieldProps.field.value) {
            this.setState({
                value: field.value || '',
            });
        }
    }

    onSuggestionsFetchRequested({ value }: { value: string }): void {
        const {suggestionHandler} = this.props;
        suggestionHandler.getSuggestions(value).then(
            (suggestions) => {
                if (suggestions && Array.isArray(suggestions)) {
                    this.setState({
                        suggestions
                    });
                }
            }
        )
    }

    onSuggestionsClearRequested(): void {
        this.setState({
            suggestions: []
        });
    }

    onSuggestionSelected(event: any, { suggestion }: any): void {
        const {onSuggestionSelect, onValueChange, suggestionHandler} = this.props;
        if (onSuggestionSelect) {
            onSuggestionSelect(suggestion);
        }

        const value = suggestionHandler.getSuggestionValue(suggestion);
        this.simulateFieldChangeEvent(value);
        if (onValueChange) {
            onValueChange(value);
        }
    }

    onValueChange(e: ChangeEvent<HTMLInputElement>): void {
        const {mustSelectSuggestion, onValueChange} = this.props;
        const value = e.target.value;
        this.setState({
            value: value || ''
        });

        if (!mustSelectSuggestion) {
            this.simulateFieldChangeEvent(value);
            if (onValueChange) {
                onValueChange(value);
            }
        }
    }

    onBlur(): void {
        const {mustSelectSuggestion, fieldProps: {field}} = this.props;
        if (mustSelectSuggestion) {
            setTimeout(() => {
                this.setState({
                    value: field.value || ''
                });
            }, 100);
        }
    }

    simulateFieldChangeEvent(value: string | undefined | null) {
        const {fieldProps: {field}} = this.props;
        const e = {
            target: {
                name: field.name,
                value,
            }
        };
        field.onChange(e);
    }

    reset(): void {
        const {onValueChange} = this.props;
        this.setState({
            value: '',
        });
        this.simulateFieldChangeEvent('');
        if (onValueChange) {
            onValueChange('');
        }
    }

    shouldRenderSuggestions(value: string, reason: ShouldRenderReasons): boolean {
        const {minCharactersForSuggestions = 3} = this.props;
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
    }

    renderSuggestionsContainer({ containerProps, children }: { containerProps: any, children: ReactNode }): ReactNode {
        const width = this.inputRef ? this.inputRef.clientWidth : 'auto';

        return (
            <div {...containerProps} style={{ width }}>
                {children}
            </div>
        );
    }

    renderInputComponent(inputProps: RenderInputComponentProps): ReactNode {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const outerThis = this;
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
                outerThis.inputRef = elem;
                if (inputProps.ref) {
                    // @ts-ignore
                    inputProps.ref(elem);
                }
            }
        };

        return (
            <input {...mergedInputProps} />
        );
    }

    render(): ReactNode {
        const {id, labelId, fieldProps: {field, meta}, maxLength, placeholder: placeholderId, intl, suggestionHandler} = this.props;
        const {value} = this.state;
        const error = meta.touched && !!meta.error;

        const placeholder = placeholderId ? intl.formatMessage({ id: placeholderId }) : null;
        const inputProps: any = {
            ...field,
            type: 'search',
            value,
            onChange: (e: ChangeEvent<HTMLInputElement>) => this.onValueChange(e),
            onBlur: () => this.onBlur(),
            placeholder,
            maxLength
        };

        return (
            <div className={`mashroom-portal-autocomplete-field mashroom-portal-ui-input ${error ? 'error' : ''}`}>
                <FieldLabel htmlFor={id} labelId={labelId}/>
                <AutoSuggest
                    suggestions={this.state.suggestions}
                    onSuggestionsFetchRequested={this.onSuggestionsFetchRequested.bind(this)}
                    onSuggestionsClearRequested={this.onSuggestionsClearRequested.bind(this)}
                    getSuggestionValue={(suggestion: any) => suggestionHandler.getSuggestionValue(suggestion)}
                    renderSuggestion={(suggestion: any, {query, isHighlighted}) => suggestionHandler.renderSuggestion(suggestion, isHighlighted, query)}
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
                {error && <ErrorMessage messageId={meta.error || ''}/>}
            </div>
        );
    }
}
