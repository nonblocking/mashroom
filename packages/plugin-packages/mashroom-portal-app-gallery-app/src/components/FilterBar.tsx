import React from 'react';
import styles from './FilterBar.scss';

type Props = {
    searchFilter: string;
    setSearchFilter: (searchFilter: string) => void;
    allCategories: Array<string>;
    categoryFilter: string;
    setCategoryFilter: (categoryFilter: string) => void;
    messages: {
        showAll: string;
        filter: string;
        category: string;
    }
}

export default ({searchFilter, setSearchFilter, allCategories, categoryFilter, setCategoryFilter, messages}: Props) => {

    return (
        <div className={styles.FilterBar}>
            <div className={styles.SearchFilter}>
                <input
                    type='search'
                    placeholder={messages.filter}
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                />
            </div>
            <div className={styles.CategoryFilter}>
                <label htmlFor='categoryFilter'>
                    {messages.category}:
                </label>
                <select id='categoryFilter' value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value=''>&lt;{messages.showAll}&gt;</option>
                    {allCategories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};
