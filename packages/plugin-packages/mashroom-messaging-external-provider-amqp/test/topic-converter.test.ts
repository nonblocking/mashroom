
import {topicToRoutingKey, routingKeyToTopic} from '../src/provider/topic-converter';

describe('topic-converter', () => {

    it('converts a topic to a routing key', () => {
        expect(topicToRoutingKey('foo')).toBe('foo');
        expect(topicToRoutingKey('foo/bar/x')).toBe('foo.bar.x');
    });

    it('converts a routing key to a topic', () => {
        expect(routingKeyToTopic('foo')).toBe('foo');
        expect(routingKeyToTopic('foo.bar.x')).toBe('foo/bar/x');
    });

});
