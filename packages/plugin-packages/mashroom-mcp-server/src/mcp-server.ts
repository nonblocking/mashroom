import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import listPortalSites from './tools/sites/list-portal-sites';
import listPortalPages from './tools/pages/list-portal-pages';
import serverInfo from './tools/server-info';
import portalPageDetails from './tools/pages/portal-page-details';
import listRegisteredPortalApps from './tools/apps/list-registered-portal-apps';
import registerRemotePortalApp from './tools/apps/register-remote-portal-app';
import unregisterRemotePortalApp from './tools/apps/unregister-remote-portal-app';
import addPortalAppToPage from './tools/apps/add-portal-app-to-page';
import removePortalAppFromPage from './tools/apps/remove-portal-app-from-page';
import movePortalAppOnPage from './tools/apps/move-portal-app-on-page';
import type {Request} from 'express';

export default (req: Request) => {

    const server = new McpServer(
        {
            name: 'mashroom-mcp-server',
            version: '1.0.0',
            websiteUrl: 'https://www.mashroom-server.com',
        },
        {
            capabilities: {
                logging: {},
            }
        }
    );

    server.registerTool(
        'server-info',
        {
            title: 'Mashroom Server Info Tool',
            description: 'Mashroom Server info such as version and default language',
            inputSchema: {
            }
        },
        serverInfo(req.pluginContext),
    );

    server.registerTool(
        'list-portal-sites',
        {
            title: 'List Portal Sites Tool',
            description: 'List all sites configured in Mashroom Portal',
            inputSchema: {
            }
        },
        listPortalSites(req),
    );

    server.registerTool(
        'list-portal-pages',
        {
            title: 'List Portal Pages Tool',
            description: 'List all configured pages in Mashroom Portal',
            inputSchema: {
                siteId: z.string().optional().describe('Filter pages by Site ID (optional)')
            }
        },
        listPortalPages(req),
    );

    server.registerTool(
        'portal-page-details',
        {
            title: 'Portal Page Details Tool',
            description: 'Details for a given Page',
            inputSchema: {
                pageId: z.string().describe('The Page ID')
            }
        },
        portalPageDetails(req),
    );

    server.registerTool(
        'list-registered-portal-apps',
        {
            title: 'List Registered Portal Apps Tool',
            description: 'List all Apps currently registered in Mashroom Portal',
            inputSchema: {
            }
        },
        listRegisteredPortalApps(req),
    );

    server.registerTool(
        'register-remote-portal-app',
        {
            title: 'Register Remote Portal App Tool',
            description: 'Register a remote App running on some server with Mashroom Portal',
            inputSchema: {
                url: z.string().describe('The full URL of the remote App'),
                waitFor: z.number().optional().describe('Number of seconds to wait for a successful registration (optional, default: 20)'),
            }
        },
        registerRemotePortalApp(req),
    );

    server.registerTool(
        'unregister-remote-portal-app',
        {
            title: 'Unregister Remote Portal App Tool',
            description: 'Unregister a remote App registered with Mashroom Portal',
            inputSchema: {
                url: z.string().describe('The full URL of the remote App'),
            }
        },
        unregisterRemotePortalApp(req),
    );

    server.registerTool(
        'add-portal-app-to-page',
        {
            title: 'Add Portal App to Page Tool',
            description: 'Add an already registered App to a specific Page and area',
            inputSchema: {
                appName: z.string().describe('The App name'),
                pageId: z.string().describe('The Page ID'),
                areaId: z.string().describe('The Area ID'),
                position: z.number().optional().describe('The position within the Area (optional, default: 0)'),
                overrideAppConfig: z.object({}).optional().describe('Override the App config (optional)'),
            }
        },
        addPortalAppToPage(req),
    );

    server.registerTool(
        'remove-portal-app-from-page',
        {
            title: 'Remove Portal App from Page Tool',
            description: 'Remove an existing App instance from a Page',
            inputSchema: {
                appName: z.string().describe('The App name'),
                appInstanceId: z.string().describe('The App Instance ID'),
                pageId: z.string().describe('The Page ID'),
            }
        },
        removePortalAppFromPage(req),
    );

    server.registerTool(
        'move-portal-app-on-page',
        {
            title: 'Move Portal App on Page Tool',
            description: 'Move an existing App instance to a different area or position on a Page',
            inputSchema: {
                appName: z.string().describe('The App name'),
                appInstanceId: z.string().describe('The App Instance ID'),
                pageId: z.string().describe('The Page ID'),
                newAreaId: z.string().describe('The new Area ID'),
                newPosition: z.number().optional().describe('The new position within the Area (optional, default: 0)'),
            }
        },
        movePortalAppOnPage(req),
    );

    return server;
};

