
import {Router} from 'express';
import {up, ready, healthy} from './checks';
import upRoute from './up_route';
import readyRoute from './ready_route';
import healthyRoute from './healthy_route';

import type {Request, Response} from 'express';

const router = Router();

const yes = '<td style="color:white;background-color:green;">Yes</td>';
const no = '<td style="color:white;background-color:red;">No</td>';

router.get('/', async (req: Request, res: Response) => {
    const isUp = up(req);
    const readyCheckResult = await ready(req);
    const healthyCheckResult = await healthy(req);
    res.type('text/html');
    res.send(`
        <!doctype html>
        <head>
            <title>Mashroom Administration</title>
            <style>
                body {
                    margin: 15px;
                    padding: 0;
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                }

                h1 {
                    font-size: 1.4em;
                    font-family: 'Lucida Grande', 'Lucida Sans Unicode', sans-serif;
                }

                table {
                    border-spacing: 0;
                    border-collapse: collapse;
                }

                td {
                    padding: 6px 10px;
                }

                th {
                    padding: 8px 10px;
                    text-align: left;
                    vertical-align: top;
                    white-space: nowrap;
                }

                tr:nth-child(odd) {
                    background-color: #f4f3f8;
                }
            </style>
        </head>
        <html>
            <h1>Mashroom Health</h1>

            <table>
                <tr>
                    <th>Up</th>
                    <td><a target="_blank" href="/mashroom/health/up">/mashroom/health/up</a></td>
                    ${isUp ? yes : no}
                    <td>&nbsp;</td>
                </tr>
                <tr>
                    <th>Ready</th>
                    <td><a target="_blank" href="/mashroom/health/ready">/mashroom/health/ready</a></td>
                    ${readyCheckResult.ok ? yes : no}
                    <td><span style="color:red">${(readyCheckResult.errors || []).join('<br/>')}</span></td>
                </tr>
                <tr>
                    <th>Healthy</th>
                    <td><a target="_blank" href="/mashroom/health/healthy">/mashroom/health/healthy</a></td>
                    ${healthyCheckResult.ok ? yes : no}
                    <td><span style="color:red">${(healthyCheckResult.errors || []).join('<br/>')}</span></td>
                </tr>
            </table>
        </html>
    `);
});

router.get('/up', upRoute);
router.get('/ready', readyRoute);
router.get('/healthy', healthyRoute);

export default router;
