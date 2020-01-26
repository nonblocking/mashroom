
import {topicToRoutingKey, routingKeyToTopic} from '../src/topic_converter';

describe('topic_converter', () => {

    it('converts a topic to a routing key', () => {
        expect(topicToRoutingKey('foo')).toBe('foo');
        expect(topicToRoutingKey('foo/bar/x')).toBe('foo.bar.x');
    });

    it('converts a routing key to a topic', () => {
        expect(routingKeyToTopic('foo')).toBe('foo');
        expect(routingKeyToTopic('foo.bar.x')).toBe('foo/bar/x');
    });

});
