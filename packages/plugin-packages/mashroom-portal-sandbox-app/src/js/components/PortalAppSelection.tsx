
import React, {PureComponent} from 'react';
import {Form, AutocompleteField, ErrorMessage} from '@mashroom/mashroom-portal-ui-commons';

import type {ReactNode} from 'react';
import type {SuggestionHandler} from '@mashroom/mashroom-portal-ui-commons/type-definitions';
import type {MashroomKnownPortalApp} from '@mashroom/mashroom-portal/type-definitions';

type Props = {
    preselectAppName: string | undefined | null;
    knownPortalApps: Array<MashroomKnownPortalApp>;
    appLoadingError: boolean;
    onSelectionChanged: (portalApp: string | undefined | null) => void;
}

export default class PortalAppSelection extends PureComponent<Props> {

    getInitialValues(): any {
        const { preselectAppName } = this.props;
        return {
            appName: preselectAppName,
        };
    }

    getSuggestionHandler(): SuggestionHandler<MashroomKnownPortalApp> {
        const { knownPortalApps } = this.props;

        return {
            getSuggestions(query: string) {
                return Promise.resolve(knownPortalApps.filter((a) => a.name.toLowerCase().indexOf(query.toLowerCase()) !== -1));
            },
            renderSuggestion(suggestion: MashroomKnownPortalApp, isHighlighted: boolean, query: string) {
                return (
                    <div
                        className={`portal-app-suggestion suggestion ${!suggestion.available ? 'not-available': ''} ${isHighlighted ? 'suggestion-highlighted' : ''}`}
                        onClick={(e) => !suggestion.available ? e.stopPropagation() : undefined}
                    >
                        <div className="portal-app-suggestion-name">
                            {suggestion.name}
                        </div>
                        {suggestion.available && (
                            <div className="portal-app-suggestion-desc">
                                {suggestion.version} {suggestion.description}
                            </div>
                        )}
                        {!suggestion.available && (
                            <div className="portal-app-suggestion-error">
                                <ErrorMessage messageId='errorAppUnavailable' />
                            </div>
                        )}
                    </div>
                );
            },
            getSuggestionValue(suggestion: MashroomKnownPortalApp) {
                return suggestion.name;
            },
        };
    }

    render(): ReactNode {
        const { onSelectionChanged, appLoadingError } = this.props;

        return (
            <div>
                <Form formId='portal-app-selection' initialValues={this.getInitialValues()} onSubmit={() => { /* nothing to do */ }}>
                    <div className='mashroom-sandbox-app-form-row'>
                        <AutocompleteField
                            id='appName'
                            name='appName'
                            labelId='appName'
                            minCharactersForSuggestions={0}
                            mustSelectSuggestion
                            suggestionHandler={this.getSuggestionHandler()}
                            onValueChange={onSelectionChanged}
                        />
                    </div>
                    {appLoadingError && (
                        <div className='app-loading-error'>
                            <ErrorMessage messageId='errorLoadingApp' />
                        </div>
                    )}
                </Form>
            </div>
        );
    }

}
