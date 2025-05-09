
import React from 'react';
import {Field} from 'formik';
import Autocomplete from './Autocomplete';

import type {FieldProps} from 'formik';
import type {SuggestionHandler} from '../../type-definitions';

type Props = {
    id: string;
    name: string;
    labelId: string;
    maxLength?: number;
    placeholder?: string;
    minCharactersForSuggestions?: number;
    mustSelectSuggestion?: boolean;
    suggestionHandler: SuggestionHandler<any>;
    onValueChange?: (value: string | undefined | null) => void;
    onSuggestionSelect?: (suggestion: any) => void;
    resetRef?: (close: () => void) => void;
}

export default (props: Props) => {
    return (
        <Field name={props.name}>
            {(fieldProps: FieldProps) => <Autocomplete fieldProps={fieldProps} {...props}/>}
        </Field>
    );
};
