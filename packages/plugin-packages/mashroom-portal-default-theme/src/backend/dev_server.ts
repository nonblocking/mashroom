/* eslint no-console: off */

import express from 'express';
import exphbs from 'express-handlebars';
import helpers from './handlebar_helpers';
import themeParams from './theme_params';

import type {Request, Response} from 'express';
import type {MashroomPortalPageRenderModel} from '@mashroom/mashroom-portal/type-definitions';

themeParams.setParams({
    showEnvAndVersions: true,
    mashroomVersion: '1.0.0'
});

const app = express();

app.use('/resources', express.static('dist/public'));

const hbs = exphbs.create({
    helpers,
    defaultLayout: '',
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

app.get('/', (req: Request, res: Response) => {

    const model: MashroomPortalPageRenderModel = {
        portalName: 'Test Portal',
        portalBasePath: '/portal',
        siteBasePath: '/portal/web',
        lang: 'en',
        availableLanguages: ['en', 'de', 'fr'],
        messages: (key) => key,
        user: {
            guest: false,
            username: 'john',
            displayName: 'John Do',
            roles: [],
        },
        csrfToken: 'foo',
        apiBasePath: '/api',
        resourcesBasePath: '/resources',
        site: {
            siteId: 'test',
            title: 'Test Site',
            path: '/test',
            pages: [
                {
                    pageId: 'test-page',
                    title: 'Test Page',
                    friendlyUrl: '/',
                    subPages: [],
                },
                {
                    pageId: 'test-page2',
                    title: 'Test Page 2',
                    friendlyUrl: '/test2',
                    subPages: [
                        {
                            pageId: 'test-page3',
                            title: 'Test Page 3',
                            friendlyUrl: '/test3',
                            subPages: [
                                {
                                    pageId: 'test-page6',
                                    title: 'Test Page 6',
                                    friendlyUrl: '/test6',
                                },
                                {
                                    pageId: 'test-hidden',
                                    title: 'HIDDEN PAGE',
                                    friendlyUrl: '/test7',
                                    hidden: true,
                                },
                            ],
                        },
                        {
                            pageId: 'test-page4',
                            title: 'Test Page 4',
                            friendlyUrl: '/test4',
                        },
                    ],
                },
                {
                    pageId: 'test-page5',
                    title: 'Test Page 5',
                    friendlyUrl: '/test5',
                },
            ],
        },
        page: {
            pageId: 'test-page2',
            title: 'Test Page 2',
            friendlyUrl: '/test2',
        },
        portalResourcesHeader: '',
        portalResourcesFooter: '',
        portalLayout: `
            <div class="row">
                <div class="mashroom-portal-app-area col-md-6" id="app-area1">
                    <div class="mashroom-portal-app-wrapper">
                        <div class="mashroom-portal-app-host">
                            <div style="padding: 10px">
                                <p>App 1</p>
                                <table>
                                    <tr>
                                        <th>Name</th>
                                        <th>Age</th>
                                    </tr>
                                    <tr>
                                        <td>Malcom</td>
                                        <td>12</td>
                                    </tr>
                                     <tr>
                                        <td>Reese</td>
                                        <td>14</td>
                                    </tr>
                                     <tr>
                                        <td>Francis</td>
                                        <td>18</td>
                                    </tr>
                                </table>

                                <br/>

                                <div class="mashroom-portal-ui-tab-dialog">
                                    <div class="tab-dialog-header">
                                        <div class="tab-dialog-button">
                                            <div class="title">Inactive tab</div>
                                        </div>
                                         <div class="tab-dialog-button active">
                                            <div class="title">Active tab</div>
                                        </div>
                                         <div class="tab-dialog-button">
                                            <div class="title">Tag with close button</div>
                                            <div class="close-button"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="mashroom-portal-app-wrapper">
                        <div class="mashroom-portal-app-host">
                            <div class="mashroom-portal-app-loading"><span/></div>
                        </div>
                    </div>
                </div>
                <div class="mashroom-portal-app-area col-md-6" id="app-area2">
                    <div class="mashroom-portal-app-wrapper">
                        <div class="mashroom-portal-app-host">
                            <div style="padding: 10px">
                                <p>App 3</p>
                                <div>
                                    <a href="#">Example Link</a>
                                </div>
                                <br/>
                                <div>
                                    <button onclick="document.getElementById('mashroom-portal-modal-overlay-app').innerHTML = '<strong>test</strong>'; document.getElementById('mashroom-portal-modal-overlay').classList.add('show');">Show modal app</button>
                                    <button disabled>Disabled button</button>
                                </div>
                                <br/>
                                <div>
                                    <input type="checkbox" id="cb_test" class="mashroom-portal-checkbox" name="test" value="test">
                                    <label for="cb_test">Checkbox Test</label>
                                </div>
                                <div>
                                    <input type="checkbox" id="cb_test2" class="mashroom-portal-checkbox" name="test2" value="test2" disabled>
                                    <label for="cb_test2">Checkbox Disabled</label>
                                </div>
                                <br/>
                                <div>
                                    <input type="radio" id="rb_test" class="mashroom-portal-radio" name="test">
                                    <label for="rb_test">Radio Test</label>
                                </div>
                                <div>
                                    <input type="radio" id="rb_test2" class="mashroom-portal-radio" name="test2" disabled>
                                    <label for="rb_test2">Radio Disabled</label>
                                </div>
                                <br/>
                                <div>
                                    <input id="text_test" name="text_test" type="text" placeholder="Enter text"/>
                                </div>
                                <div>
                                    <input id="text_test2" name="text_test2" type="text" placeholder="Disabled" disabled/>
                                </div>
                                <br/>
                                <div>
                                    <select id="select_test" name="select_test">
                                        <option value="1">One</option>
                                        <option value="2">One</option>
                                        <optgroup label="Foo">
                                            <option value="3">Three</option>
                                            <option value="4">Four</option>
                                        </optgroup>
                                    </select>
                                </div>
                                <div>
                                    <select id="select_test2" name="select_test2" disabled="disabled">
                                       <option value="1">One</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="mashroom-portal-app-wrapper">
                        <div class="mashroom-portal-app-header">
                            <div class="mashroom-portal-app-header-title">App 4</div>
                            <div class="mashroom-portal-app-header-close"></div>
                        </div>
                        <div class="mashroom-portal-app-host">
                            <div class="mashroom-portal-app-loading-error">
                                <span>Loading App 4 failed</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `,
        userAgent: {
            browser: {
                name: 'Firefox',
                version: '62'
            },
            os: {
                name: undefined
            }
        }
    };

    res.render('portal', model);
});

app.listen(5055, () => {
    console.info('Server started at port 5055');
});
app.once('error', (error) => {
    console.error('Failed to start server!', error);
});
