import React from 'react';
import styles from './HighlightFilterQuery.scss';

type Props = {
    text: string;
    searchFilter: string | undefined;
}

export default ({text, searchFilter}: Props) => {
    if (!searchFilter || searchFilter.length < 3) {
        return text;
    }

    const tokens = searchFilter.split(' ').filter((t) => !!t.trim());
    const replaceExpr = new RegExp(`(${tokens.join('|')})`, 'gi');
    const highlightedText = text.replace(replaceExpr, `<span class='${styles.Highlight}'>$1</span>`);

    return (
        <span dangerouslySetInnerHTML={{ __html: highlightedText }} />
    );
};
