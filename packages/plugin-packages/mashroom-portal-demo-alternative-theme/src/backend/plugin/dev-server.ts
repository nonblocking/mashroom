/* eslint no-console: off */

import {resolve} from 'path';
import express from 'express';
import engine from './react-engine';
import themeParams from './theme-params';
import type {Request, Response} from 'express';
import type {MashroomPortalPageRenderModel} from '@mashroom/mashroom-portal/type-definitions';

themeParams.setParams({
    mashroomVersion: '1.0.0',
});

const app = express();

app.use('/resources', express.static('dist/public'));

app.engine('js', engine);
app.set('view engine', 'js');
app.set('views', resolve(__dirname, '../views'));

app.get('/', (req: Request, res: Response) => {

    const model: MashroomPortalPageRenderModel = {
        portalName: 'Test Portal',
        siteBasePath: '/portal/web',
        adminApp: null,
        lang: 'en',
        availableLanguages: ['en', 'de', 'fr'],
        messages: (key) => key,
        user: {
            guest: false,
            admin: false,
            username: 'john',
            displayName: 'John Do',
            roles: [],
        },
        csrfToken: 'foo',
        apiBasePath: '/api',
        resourcesBasePath: '/resources',
        lastThemeReloadTs: Date.now(),
        themeVersionHash: 'aaaaa',
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
        portalLayout: 'deprecated',
        pageContent: `
            <div class="row">
                <div class="mashroom-portal-app-area col-md-6" id="app-area1">
                    <div class="mashroom-portal-app-wrapper">
                        <div class="mashroom-portal-app-host">
                            <div style="padding: var(--mashroom-portal-spacing-default)">
                                <h2>Header 2</h2>
                                <h3>Header 3</h3>
                                <h4>Header 4</h4>
                                <table class="table-striped">
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
                     <div class="mashroom-portal-app-wrapper">
                        <div class="mashroom-portal-app-header">
                            <div class="mashroom-portal-app-header-title">App 5</div>
                            <div class="mashroom-portal-app-header-close"></div>
                        </div>
                        <div class="mashroom-portal-app-host">
                           <div style="padding: var(--mashroom-portal-spacing-default)">
                                <p>Here some text with a ruler</p>
                                <hr/>
                                <p>and a blockquote</p>
                                <blockquote>
                                    The quote
                                </blockquote>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mashroom-portal-app-area col-md-6" id="app-area2">
                    <div class="mashroom-portal-app-wrapper">
                        <div class="mashroom-portal-app-host">
                            <div style="padding: var(--mashroom-portal-spacing-default)">
                                <div>
                                    <a href="#">Example Link</a>
                                </div>
                                <br/>
                                <div>
                                    <button onclick="document.getElementById('mashroom-portal-modal-overlay-app').innerHTML = '<strong>test</strong>'; document.getElementById('mashroom-portal-modal-overlay').classList.add('show');">Show modal app</button>
                                    <button class="mashroom-portal-ui-button secondary">Secondary Button</button>
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

app.listen(5066, () => {
    console.info('Server started at port 5066');
});
app.once('error', (error) => {
    console.error('Failed to start server!', error);
});
