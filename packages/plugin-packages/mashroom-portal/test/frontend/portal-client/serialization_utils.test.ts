
import {serializeObject} from '../../../src/frontend/portal-client/js/serialization_utils';

describe('serializationUtils', () => {

    it('serializes a number', () => {
        expect(serializeObject(2)).toBe('2');
    });

    it('serializes a object literal', () => {
        const o = {
            a: 2,
            b: '4'
        };
        expect(serializeObject(o)).toBe('{"a":2,"b":"4"}');
    });

    it('serializes an error', () => {
        const e = new Error('this is the problem');
        const serialized = serializeObject(e);
        expect(serialized).toContain('"message": "this is the problem"');
        expect(serialized).toContain('"stack":');
    });

});
