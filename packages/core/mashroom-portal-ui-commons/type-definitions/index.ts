
import type {ReactNode} from 'react';
import type {Dispatch as ReduxDispatch, Store as ReduxStore, AnyAction} from 'redux';

export type CommonState = {
    modals: ModalState;
    tabDialogs: TabDialogState;
}

export type Action = AnyAction;

export type Dispatch = ReduxDispatch<Action>;

export type Store = ReduxStore<Partial<CommonState>, Action>;

export type ValidationErrors = {
    [fieldName: string]: string | any;
}
export type FormValidator = (values: any) => ValidationErrors;

export type FormContext = {
    resetForm: () => void;
    setFieldValue: (field: string, value: any) => void;
    initialValues: any;
}

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
