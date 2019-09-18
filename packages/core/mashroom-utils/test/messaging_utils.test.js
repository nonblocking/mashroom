// @flow

import {topicMatcher} from '../src/messaging_utils';

describe('messaging_utils.topicMatcher', () => {

    it('matches simple topics correctly', () => {
        expect(topicMatcher('foo/bar', 'foo/bar')).toBeTruthy();
        expect(topicMatcher('a', 'a')).toBeTruthy();
        expect(topicMatcher('foo/bar', 'foo/bars')).toBeFalsy();
        expect(topicMatcher('a', 'b')).toBeFalsy();
    });

    it('matches wildcard topics correctly', () => {
        expect(topicMatcher('foo/#', 'foo/bar')).toBeTruthy();
        expect(topicMatcher('foo/#', 'foo/#')).toBeTruthy();
        expect(topicMatcher('foo/#/bar', 'foo/a/b/c/bar')).toBeTruthy();
        expect(topicMatcher('foo/#', 'foo/*/test')).toBeTruthy();
        expect(topicMatcher('a/+/c', 'a/b/c')).toBeTruthy();
        expect(topicMatcher('a/*/c', 'a/b/c')).toBeTruthy();
        expect(topicMatcher('foo/#', 'foo2/bars')).toBeFalsy();
        expect(topicMatcher('a/+/c', 'a/c/d')).toBeFalsy();
    });

});
