import express from 'express';
import mcpApi from './mcp-api';

const start = async () => {
    const app = express();

    // Disable CORS
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, MCP-Protocol-Version');
        next();
    });

    // Dummy services
    app.use((req, res, next) => {
        const pluginContext: any = {
            loggerFactory: () => console,
            services: {
                core: {} as any,
                portal: {
                    service: {
                        getSites: async () => {
                            return [];
                        },
                        getSite: async (siteId: string) => {
                            return null;
                        },
                    }
                }
            }
        };

        req.pluginContext = pluginContext;

        next();
    });

    app.use('/mcp', mcpApi);

    app.listen(5099, () => {
        console.log('MCP Server started on http://localhost:5099/mcp');
    });
    app.once('error', (error) => {
        console.error('Failed to start server!', error);
    });
};

start();

