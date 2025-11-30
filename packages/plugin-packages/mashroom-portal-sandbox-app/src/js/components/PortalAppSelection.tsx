import React, { useMemo } from 'react';
import { Form, AutocompleteField, ErrorMessage } from '@mashroom/mashroom-portal-ui-commons';
import useStore from '../store/useStore';

import type { SuggestionHandler } from '@mashroom/mashroom-portal-ui-commons/type-definitions';
import type { MashroomKnownPortalApp } from '@mashroom/mashroom-portal/type-definitions';

type Props = {
    preselectAppName: string | undefined | null;
    onSelectionChanged: (portalApp: string | undefined | null) => void;
}

export default ({preselectAppName, onSelectionChanged}: Props) => {
    const knownPortalApps = useStore((state) => state.knownPortalApps);
    const appLoadingError = useStore((state) => state.appLoadingError);

    const initialValues = useMemo(() => {
        return {
            appName: preselectAppName,
        };
    }, [preselectAppName]);

    const suggestionHandler: SuggestionHandler<MashroomKnownPortalApp> = useMemo(() => {
        return {
            getSuggestions(query: string) {
                // knownPortalApps is stable within this useMemo's scope for each computation
                return Promise.resolve(knownPortalApps.filter((a) => a.name.toLowerCase().indexOf(query.toLowerCase()) !== -1));
            },
            renderSuggestion(suggestion: MashroomKnownPortalApp, isHighlighted: boolean, query: string) {
                return (
                    <div
                        className={`portal-app-suggestion suggestion ${!suggestion.available ? 'not-available' : ''} ${isHighlighted ? 'suggestion-highlighted' : ''}`}
                        // Prevent click if not available by stopping propagation, consistent with original logic
                        onClick={(e) => { if (!suggestion.available) e.stopPropagation(); }}
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
    }, [knownPortalApps]);

    return (
        <div>
            <Form
                formId='portal-app-selection'
                initialValues={initialValues}
                onSubmit={() => { /* nothing to do */ }}
            >
                <div className='mashroom-sandbox-app-form-row'>
                    <AutocompleteField
                        id='appName'
                        name='appName'
                        labelId='appName'
                        minCharactersForSuggestions={0}
                        mustSelectSuggestion
                        suggestionHandler={suggestionHandler}
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
};
