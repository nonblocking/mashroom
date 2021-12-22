
import {Router} from 'express';
import {up, ready, healthy} from './checks';
import upRoute from './up_route';
import readyRoute from './ready_route';
import healthyRoute from './healthy_route';

import type {Request, Response} from 'express';

const router = Router();

const yes = '<td style="color:white;background-color:green;">Yes</td>';
const no = '<td style="color:white;background-color:red;">No</td>';

router.get('/', (req: Request, res: Response) => {
    res.type('text/html');
    res.send(`
        <!doctype html>
        <head>
            <title>Mashroom Administration</title>
            <style type="text/css">
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
                    ${up(req) ? yes : no}
                    <td><a target="_blank" href="/mashroom/health/up">/mashroom/health/up</a></td>
                </tr>
                <tr>
                    <th>Ready <sup>1)</sup></th>
                    ${ready(req) ? yes : no}
                    <td><a target="_blank" href="/mashroom/health/ready">/mashroom/health/ready</a></td>
                </tr>
                <tr>
                    <th>Healthy <sup>2)</sup></th>
                    ${healthy(req) ? yes : no}
                    <td><a target="_blank" href="/mashroom/health/healthy">/mashroom/health/healthy</a></td>
                </tr>
            </table>
            <p>
                <sup>1)</sup> All plugins are loaded successfully.
            </p>
            <p>
                <sup>2)</sup> No unhandled exceptions (which normally would have terminated Node.js) occurred.
            </p>
        </html>
    `);
});

router.get('/up', upRoute);
router.get('/ready', readyRoute);
router.get('/healthy', healthyRoute);

export default router;
