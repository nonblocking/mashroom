
import React, {PureComponent} from 'react';
import {injectIntl} from 'react-intl';
import {Field} from 'redux-form';
import AutocompleteField from '../components/AutocompleteField';

import type {IntlShape} from 'react-intl';
import type {WrappedFieldProps} from 'redux-form';
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

class AutocompleteFieldContainer extends PureComponent<Props> {

    render() {
        return <Field name={this.props.name} component={(fieldProps: WrappedFieldProps) => <AutocompleteField fieldProps={fieldProps} {...this.props}/>}/>;
    }
}

export default injectIntl(AutocompleteFieldContainer);
