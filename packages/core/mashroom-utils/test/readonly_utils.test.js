// @flow

import {cloneAndFreezeObject, cloneAndFreezeArray, createReadonlyProxy} from '../src/readonly_utils';
import ReadOnlyError from '../src/ReadOnlyError';

describe('readonly_utils.cloneAndFreezeObject', () => {

    it('creates a frozen clone of the object', () => {
        const obj: any = {
            foo: 'bar',
            x: 1,
            a: [1, 2, 3],
        };

        const frozenObj = cloneAndFreezeObject(obj);

        expect(frozenObj).toBeTruthy();
        expect(frozenObj).toEqual(obj);
        expect(frozenObj.x).toBe(1);
        expect(() => obj.x = 2).not.toThrow(TypeError);
        expect(() => frozenObj.x = 2).toThrow(TypeError);

        obj.ext = 123;
        expect(frozenObj.ext).toBeFalsy();
    });

});

describe('readonly_utils.cloneAndFreezeArray', () => {

    it('creates a frozen clone of the array', () => {
        const arr = [1, 2, 3];
        const frozenArr = cloneAndFreezeArray(arr);

        expect(frozenArr).toBeTruthy();
        expect(frozenArr).toEqual(arr);
        expect(() => frozenArr[1] = 22).toThrow(TypeError);
    });

});

describe('readonly_utils.createReadonlyProxy', () => {

    it('makes all properties of an object readonly', () => {

        const obj: any = {
            foo: 'bar',
            x: 1,
            a: [1, 2, 3],
            o: {
                bar: 'foo',
            },
        };

        const readOnlyObj = createReadonlyProxy(obj);

        expect(readOnlyObj).toBeTruthy();
        expect(readOnlyObj).toEqual(obj);
        expect(readOnlyObj.x).toBe(1);
        expect(() => obj.x = 2).not.toThrow(ReadOnlyError);
        expect(() => readOnlyObj.x = 2).toThrow(ReadOnlyError);
        expect(() => readOnlyObj.a[1] = 22).toThrow(TypeError);
        expect(() => readOnlyObj.o.bar = 'y').toThrow(ReadOnlyError);

        obj.ext = 123;
        expect(readOnlyObj.ext).toBe(123);
    });

});
