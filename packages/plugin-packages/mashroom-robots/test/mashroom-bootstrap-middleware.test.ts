import {resolve} from 'path';
import {mkdirSync, writeFileSync} from 'fs';
import middlewareBootstrap from '../src/mashroom-bootstrap-middleware';

describe('mashroom robots middleware', () => {

    it('loads the configured robots.txt file', async () => {
        const testDataDir = resolve(__dirname, '../test-data');
        try {
            mkdirSync(testDataDir, { recursive: true });
            writeFileSync(resolve(testDataDir, 'robots.txt'), 'foo');
        } catch {
            // Ignore
        }

        const middleware = await middlewareBootstrap('', {
            'robots.txt': 'robots.txt'
        }, {
            getPluginContext: () => ({
                loggerFactory: () => console,
               serverConfig: { serverRootFolder: testDataDir }
            } as any),
        });

        let sendFilePath;
        const req: any = {
            url: '/robots.txt'
        };
        const res: any = {
            sendFile: (path: string) => {
                sendFilePath = path;
            }
        };

        middleware(req, res, () => { /* do nothing */ });

        expect(sendFilePath).toBe(resolve(testDataDir, 'robots.txt'));
    });

});
