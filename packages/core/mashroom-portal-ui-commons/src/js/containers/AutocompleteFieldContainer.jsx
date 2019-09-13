// @flow

import React, {PureComponent} from 'react';
import {injectIntl} from 'react-intl';
import {Field} from 'redux-form';
import AutocompleteField from '../components/AutocompleteField';

import type {Node, ComponentType} from 'react';
import type {IntlShape} from 'react-intl';
import type {FieldProps} from 'redux-form';
import type {SuggestionHandler} from '../../../type-definitions';

type OwnProps = {
    id: string,
    name: string,
    labelId: string,
    maxLength?: number,
    placeholder?: string,
    minCharactersForSuggestions?: number,
    mustSelectSuggestion?: boolean,
    suggestionHandler: SuggestionHandler<*>,
    onValueChange?: (value: ?string) => void,
    onSuggestionSelect?: (any) => void,
    resetRef?: (() => void) => void,
}

type IntlProps = {
    intl: IntlShape
}

type State = {
    suggestions: Array<any>;
}

class AutocompleteFieldContainer extends PureComponent<OwnProps & IntlProps, State> {

    render() {
        return <Field name={this.props.name} component={(fieldProps: FieldProps): Node => <AutocompleteField fieldProps={fieldProps} {...this.props}/>}/>;
    }
}

export default (injectIntl(AutocompleteFieldContainer): ComponentType<OwnProps>);
