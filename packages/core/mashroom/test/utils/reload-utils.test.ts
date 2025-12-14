import express from 'express';
import {removeFromExpressStack} from '../../src/utils/reload-utils';
import ExpressRequestHandlerWrapper from '../../src/plugins/built-in/loaders/ExpressRequestHandlerWrapper';

describe('reload-utils.removeFromExpressStack', () => {

    it('Removes a webapp from the Express stack', () => {
        const app = express();
        const plugin: any = {
            name: 'my-webapp'
        };

        const wrapper = new ExpressRequestHandlerWrapper('my-webapp',
            (req, res) => res.send('Hello World!'));

        app.get('/', wrapper.handler());
        app.use('/foo', () => {});

        expect(app.router.stack.length).toBe(2);

        removeFromExpressStack(app, plugin);

        expect(app.router.stack.length).toBe(1);
    });

});
