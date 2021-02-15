
import React from 'react';
import {escapeForRegExp} from '../services/escape_utils';

import type {SuggestionHandler} from '../../type-definitions';

export default class AutocompleteStringArraySuggestionHandler implements SuggestionHandler<string> {

    constructor(private data: Array<string>, private searchEverywhere = true, private maxMatches?: number) {
    }

    getSuggestions(query: string): Promise<Array<string>> {
        if (!query) {
            return Promise.resolve([]);
        }
        const regexp = this._getQueryRexExp(query);
        let suggestions = this.data.filter((d) => {
            const match = regexp.exec(d);
            // Reset lastIndex
            regexp.exec('');
            return match && (this.searchEverywhere || match.index === 0);
        });
        if (this.maxMatches && this.maxMatches > 0) {
            suggestions = suggestions.slice(0, this.maxMatches);
        }
        return Promise.resolve(suggestions);
    }

    renderSuggestion(suggestion: string, isHighlighted: boolean, query: string) {
        if (query) {
            const regexp = this._getQueryRexExp(query);
            suggestion = suggestion.replace(regexp, '<span class="filter-match">$1</span>');
        }

        return (
            <div className={`suggestion ${isHighlighted ? 'suggestion-highlighted' : ''}`} dangerouslySetInnerHTML={{ __html: suggestion }} />
        );
    }

    getSuggestionValue(suggestion: string) {
        return suggestion;
    }

    _getQueryRexExp(query: string) {
        const escaped = escapeForRegExp(query);
        return new RegExp(`(${escaped})`, 'ig');
    }
}
