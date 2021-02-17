
export const WILDCARDS_MULTI = ['#'];
export const WILDCARDS_SINGLE = ['+', '*'];
const WILDCARDS_OTHER= ['?'];
const ALL_WILDCARDS = [...WILDCARDS_MULTI, ...WILDCARDS_SINGLE, ...WILDCARDS_OTHER];

export const containsWildcard = (topic: string): boolean => {
    const allWildcardRegex = new RegExp(`[${ALL_WILDCARDS.join('')}]`);
    return topic.search(allWildcardRegex) !== -1;
};

export const startsWithWildcard = (topic: string): boolean => {
    const allWildcardRegex = new RegExp(`[${ALL_WILDCARDS.join('')}]`);
    return topic.search(allWildcardRegex) === 0;
};

export const topicMatcher = (pattern: string, topic: string): boolean => {
    let regex = `^${pattern}$`;
    WILDCARDS_SINGLE.forEach((w) => regex = regex.replace(w, '[^/]+'));
    WILDCARDS_MULTI.forEach((w) => regex = regex.replace(w, '.*'));
    const matcher = new RegExp(regex);

    return !!topic.match(matcher);
};
