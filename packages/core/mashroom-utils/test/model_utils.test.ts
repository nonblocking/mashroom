
import {deepAssign} from '../src/model_utils';

describe('model_utils.deepAssign', () => {

    it('should merge nested objects correctly', () => {
        const obj1: any = {
            foo: 'bar',
            x: 1,
            a: [1, 2, 3],
            n: {
                m: 2
            }
        };

        const obj2: any = {
            x: 2,
            b: [],
            n: {
                o: 'o',
                p: {
                    q: 4
                }
            }
        };

        const mergedObj = deepAssign({}, obj1, obj2);

        expect(mergedObj).toEqual({
            foo: 'bar',
            x: 2,
            a: [1, 2, 3],
            b: [],
            n: {
                m: 2,
                o: 'o',
                p: {
                    q: 4
                }
            }
        });
    });

});
