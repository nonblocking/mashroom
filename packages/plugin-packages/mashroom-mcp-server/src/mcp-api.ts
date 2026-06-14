import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {Router} from 'express';
import bodyParser from 'body-parser';
import mcpServer from './mcp-server';
import type {Request, Response} from 'express';

const router = Router();

router.use(bodyParser.json());

router.post('/', async (req: Request, res: Response) => {
    const logger = req.pluginContext.loggerFactory('mashroom.mcp');

    logger.debug('Received MCP request:', req.body);

    try {
        const server = mcpServer(req.pluginContext);

        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
        });

        await server.connect(transport);

        await transport.handleRequest(req, res, req.body);
        res.on('close', () => {
            logger.debug('Close MCP request');
            transport.close();
            server.close();
        });
    } catch (error) {
        logger.error('Error handling MCP request:', error);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: 'Internal server error'
                },
                id: null
            });
        }
    }
});

router.get('/', async (req: Request, res: Response) => {
    res.writeHead(405).end(
        JSON.stringify({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: 'Method not allowed.'
            },
            id: null
        })
    );
});

router.delete('/', async (req: Request, res: Response) => {
    res.writeHead(405).end(
        JSON.stringify({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: 'Method not allowed.'
            },
            id: null
        })
    );
});

export default router;
