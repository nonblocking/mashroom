
import {escapeHtml} from '@mashroom/mashroom-utils/lib/html_utils';
import infoTemplate from './template';

import type {Request, Response} from 'express';
import type {MashroomPluginContext} from '../../../../../type-definitions';

const pluginsRoute = (req: Request, res: Response) => {
    res.type('text/html');
    res.send(infoTemplate(plugins(req.pluginContext), req));
};

export default pluginsRoute;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const plugins = (pluginContext: MashroomPluginContext) => `
    <h2>Plugin Packages</h2>
    ${pluginPackagesTable(pluginContext)}
`;

const pluginPackagesTable = (pluginContext: MashroomPluginContext) => {
    const pluginPackagesRows: Array<string> = [];

    const pluginPackages = [...pluginContext.services.core.pluginService.getPluginPackages()];
    pluginPackages.sort((p1, p2) => p1.name.localeCompare(p2.name));

    pluginPackages.forEach((pp) => {
        const homepageLink = pp.homepage ? `<a target='_blank' href="${pp.homepage}">${pp.homepage}</a>` : '';
        let statusStyle = '';
        let rowBackgroundStyle = '';
        if (pp.status === 'ready') {
            statusStyle = 'color:green';
        }
        if (pp.status === 'error') {
            statusStyle = 'color:red';
            rowBackgroundStyle = 'background-color:#FFDDDD';
        }
        pluginPackagesRows.push(`
            <tr style="${rowBackgroundStyle}">
                <td>${escapeHtml(pp.name)}</td>
                <td>${homepageLink}</td>
                <td>${escapeHtml(pp.author || '')}</td>
                <td>${pp.license || ''}</td>
                <td>${pp.version}</td>
                <td style="${statusStyle}">${capitalize(pp.status)}</td>
                <td>${escapeHtml(pp.errorMessage || '')}</td>
            </tr>`);
    });

    return `
        <table>
            <tr>
                <th>Name</th>
                <th>Homepage</th>
                <th>Author</th>
                <th>License</th>
                <th>Version</th>
                <th>Status</th>
                <th>Error</th>
            </tr>
            ${pluginPackagesRows.join('')}
        </table>
    `;
};
