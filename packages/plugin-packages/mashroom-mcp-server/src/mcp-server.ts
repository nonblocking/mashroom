import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import listPortalSites from './tools/sites/list-portal-sites';
import listPortalSitePages from './tools/sites/list-portal-site-pages';
import serverInfo from './tools/server-info';
import portalPageDetails from './tools/pages/portal-page-details';
import listRegisteredPortalApps from './tools/apps/list-registered-portal-apps';
import type {MashroomPluginContext} from '@mashroom/mashroom/type-definitions';

export default (pluginContext: MashroomPluginContext) => {

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
        serverInfo(pluginContext),
    );

    server.registerTool(
        'list-portal-sites',
        {
            title: 'List Portal Sites Tool',
            description: 'List all sites configured in Mashroom Portal',
            inputSchema: {
            }
        },
        listPortalSites(pluginContext),
    );

    server.registerTool(
        'list-portal-site-pages',
        {
            title: 'List Portal Site Pages Tool',
            description: 'List all pages configured in a given Site in Mashroom Portal',
            inputSchema: {
                siteId: z.string().describe('The Site ID')
            }
        },
        listPortalSitePages(pluginContext),
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
        portalPageDetails(pluginContext),
    );

    server.registerTool(
        'list-registered-portal-apps',
        {
            title: 'List Registered Portal Apps Tool',
            description: 'List all Apps currently registered in Mashroom Portal',
            inputSchema: {
            }
        },
        listRegisteredPortalApps(pluginContext),
    );

    return server;
};

