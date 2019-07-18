// @flow

import type {Node} from 'react';
import type {Dispatch as ReduxDispatch, Store as ReduxStore} from 'redux';

export type CommonState = {
    modals: ModalState,
    tabDialogs: TabDialogState
}

export type Action = { type: string } & { [any]: any };

export type Dispatch = ReduxDispatch<Action>;

export type Store = ReduxStore<$Subtype<CommonState>, Action>;

export type ValidationErrors = {
    [fieldName: string]: string | Object
}
export type FormValidator = (values: Object) => ValidationErrors;

export type ModalState = {
    [name: string]: {
        show: boolean
    }
};

export type TabDialogState = {
    [name: string]: {
        active: string
    }
};

export interface SuggestionHandler<T> {
    getSuggestions(query: string): Promise<Array<T>>;
    renderSuggestion(suggestion: T, isHighlighted: boolean, query: string): Node;
    getSuggestionValue(suggestion: T): string;
}
