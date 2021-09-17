
import React, {PureComponent} from 'react';
import {injectIntl} from 'react-intl';
import {Field} from 'formik';
import AutocompleteFieldComp from '../components/AutocompleteField';

import type {IntlShape} from 'react-intl';
import type {FieldProps} from 'formik';
import type {SuggestionHandler} from '../../type-definitions';

type OwnProps = {
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

type IntlProps = {
    intl: IntlShape
}

type Props = OwnProps & IntlProps;

class AutocompleteField extends PureComponent<Props> {

    render() {
        const {name} = this.props;
        return (
            <Field name={name}>
                {(fieldProps: FieldProps) => <AutocompleteFieldComp fieldProps={fieldProps} {...this.props}/>}
            </Field>
        );
    }
}

export default injectIntl(AutocompleteField);
