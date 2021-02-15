
import type {ReactNode} from 'react';
import type {Dispatch as ReduxDispatch, Store as ReduxStore, AnyAction} from 'redux';
import type {FormStateMap} from 'redux-form';

export type CommonState = {
    modals: ModalState;
    tabDialogs: TabDialogState;
    form: FormStateMap;
}

export type Action = AnyAction;

export type Dispatch = ReduxDispatch<Action>;

export type Store = ReduxStore<Partial<CommonState>, Action>;

export type ValidationErrors = {
    [fieldName: string]: string | any;
}
export type FormValidator = (values: any) => ValidationErrors;

export type AsyncFormValidator = (values: any) => Promise<void>;

export type SelectFieldOption = {
    value: string | undefined | null;
    label: ReactNode;
}

export type SelectFieldOptions = Array<SelectFieldOption>;

export type ModalState = {
    [name: string]: {
        show: boolean
    }
};

export type TabDialogState = {
    [name: string]: {
        active: string;
    }
};

export interface SuggestionHandler<T> {
    getSuggestions(query: string): Promise<Array<T>>;
    renderSuggestion(suggestion: T, isHighlighted: boolean, query: string): ReactNode;
    getSuggestionValue(suggestion: T): string;
}
