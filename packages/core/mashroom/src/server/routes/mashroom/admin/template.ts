
import type {Request} from 'express';

export default (content: string, req: Request) => {
    const adminIntegrationPlugins = [...req.pluginContext.services.core.pluginService.getPlugins().filter((p) => p.type === 'admin-ui-integration' && !!p.config?.menuTitle)];
    adminIntegrationPlugins.sort((p1, p2) => p1.config?.weight - p2.config?.weight);

    const extraMenuEntry = adminIntegrationPlugins.map(({config}) => ({
        menuTitle: config?.menuTitle || '???',
        path: config?.path || '???',
    }));

    return `
        <!doctype html>
        <html lang="en">
            <head>
                <title>Mashroom Administration</title>
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        text-rendering: optimizeLegibility;
                        font-size: 16px;
                        line-height: 1.5;
                        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                        background-color: #F2F2F2;
                    }

                    h1 {
                        font-size: 1.4em;
                    }

                    h2 {
                        font-size: 1.2em;
                        font-weight: normal;
                        margin: 20px 0;
                    }

                    pre, .json, .console {
                        font-family:  Consolas, 'Liberation Mono', Courier, monospace;
                        font-size: 14px;
                        word-break: break-all;
                    }

                    a {
                        color: #4D487F;
                        text-decoration: none;
                    }

                    a:hover {
                        color: #3a365f;
                    }

                    header {
                        background-color: #4D487F;
                        display: flex;
                    }

                    header h1 {
                        color: white;
                        font-weight: normal;
                        margin: auto 0;
                        flex-grow: 2;
                    }

                    header .logo {
                        padding: 10px 25px 8px 25px;
                    }

                    header .auto-refresh-toggle {
                        padding: 18px 25px;
                    }

                    header .auto-refresh-toggle a {
                        font-size: 0.8em;
                        color: white;
                    }

                    header .auto-refresh-toggle a:hover {
                        color: #f4f3f8;
                    }

                    #content-wrapper {
                        display: flex;
                    }

                    nav ul {
                        padding: 0;
                        margin: 20px 10px;
                        border-radius: 10px;
                    }

                    .menu-item {
                        list-style-type: none;
                        overflow: hidden;

                        &:first-child {
                            border-top-left-radius: 10px;
                            border-top-right-radius: 10px;
                        }

                        &:last-child {
                            border-bottom-left-radius: 10px;
                            border-bottom-right-radius: 10px;
                        }
                    }

                    .menu-item a {
                        display: inline-block;
                        width: 100%;
                        color: black;
                        text-decoration: none;
                        white-space: nowrap;
                        padding: 7px 25px;
                        background-color: #E2E2E2;
                        margin-bottom: 1px;

                    }

                    .menu-item a:hover {
                        background-color: #cfcde3;
                    }

                    .menu-item.active a {
                        background-color: #4D487F;
                        color: white;
                        text-decoration: none;
                        cursor: default;
                    }

                    main {
                        margin: 5px 20px;
                        overflow: hidden;
                        width: 100%;
                    }

                    main ul {
                        margin: 0;
                    }

                    main li {
                        padding: 3px 0;
                    }

                    table, th, td {
                        border: none;
                    }

                    table {
                        border-spacing: 0;
                        border-collapse: collapse;
                    }

                    th {
                        padding: 8px 10px;
                        text-align: left;
                        vertical-align: top;
                        white-space: nowrap;
                        font-weight: 700;
                    }

                    td {
                        padding: 8px 10px;
                        line-height: 1.25em;
                        vertical-align: top;
                    }

                    tr:nth-child(even) {
                        background-color: #E2E2E2;
                    }

                    table.overview th {
                        font-weight: normal;
                    }

                    .details-link {
                        padding: 20px 0;
                    }

                    .admin-ui-integration-wrapper {
                        width: 100%;
                    }

                    #modal {
                        position: fixed;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        width: 100%;
                        height: 100%;
                        overflow: auto;
                        background-color: rgba(68, 68, 68, 0.6);
                        z-index: 5000;
                    }

                    #modal .modal-wrapper {
                        position: relative;
                        display: table;
                        margin: 10% auto;
                        min-width: 250px;
                        max-width: 90%;
                        box-shadow: 2px 4px 4px #444;
                        background-color: white;
                    }

                    #modal .modal-header {
                        position: relative;
                        width: 100%;
                    }

                    #modal .modal-header .modal-close {
                        position: absolute;
                        right: 10px;
                        top: 10px;
                        color: black;
                        cursor: pointer;
                    }

                    #modal-content {
                        min-width: 250px;
                        min-height: 250px;
                        padding: 30px;
                    }
                </style>

                <script type="text/javascript">
                    var refreshEnabled = document.cookie.split('; ').find(function(keyValue) {
                        return keyValue === 'mashroomAdminUIAutoRefresh=1';
                    });

                    function startAutoRefresh() {
                        setTimeout(function() {
                            window.location.reload();
                        }, 5000);
                    }

                    function toggleAutoRefresh() {
                        if (refreshEnabled) {
                            document.cookie = 'mashroomAdminUIAutoRefresh=1; path=/; max-age=-1;';
                        } else {
                            document.cookie = 'mashroomAdminUIAutoRefresh=1; path=/; max-age=2592000;';
                        }
                        window.location.reload();
                    }

                    function openModal(content) {
                        document.getElementById('modal-content').innerHTML = content;
                        document.getElementById('modal').style.display = 'block';
                    }

                    function closeModal() {
                        document.getElementById('modal').style.display = 'none';
                    }

                    document.addEventListener('keydown', function (e) {
                        if (e.key === 'Escape'|| e.key === 'Esc') {
                            closeModal();
                        }
                    });

                    document.addEventListener('DOMContentLoaded', function () {
                        if (refreshEnabled) {
                            document.getElementById('autoRefreshToggle').innerText = 'Disable Auto Refresh';
                            startAutoRefresh();
                        }
                    });
                </script>
            </head>
            <body>
                <header>
                    <div class="logo">
                       <svg width="40" height="40" viewBox="0 0 250 190" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 72.0771C0 70.7653 0.580079 69.5203 1.5854 68.6744L81.9425 1.05795C84.8452 -1.38445 89.2857 0.673238 89.2857 4.46067V116.796C89.2857 118.095 88.7168 119.329 87.7281 120.175L7.37091 188.918C4.47539 191.395 0 189.344 0 185.539V72.0771Z" fill="white"/>
                            <path d="M80.3571 72.0771C80.3571 70.7653 80.9372 69.5203 81.9425 68.6744L162.3 1.05795C165.202 -1.38445 169.643 0.673238 169.643 4.46067V116.796C169.643 118.095 169.074 119.329 168.085 120.175L87.7281 188.918C84.8325 191.395 80.3571 189.344 80.3571 185.539V72.0771Z" fill="white"/>
                            <path d="M160.714 72.0771C160.714 70.7653 161.294 69.5203 162.3 68.6744L242.657 1.05795C245.559 -1.38445 250 0.673238 250 4.46067V116.796C250 118.095 249.431 119.329 248.442 120.175L168.085 188.918C165.19 191.395 160.714 189.344 160.714 185.539V72.0771Z" fill="white"/>
                        </svg>
                    </div>
                    <h1>Mashroom Server Admin UI</h1>
                    <div class="auto-refresh-toggle">
                        <a id="autoRefreshToggle" href="javascript:toggleAutoRefresh()">Enable Auto Refresh</a>
                    </div>
                </header>
                <div id="content-wrapper">
                    <nav>
                        <ul>
                            <li class="menu-item ${req.path === '/' ? 'active' : ''}"><a href="/mashroom/admin">Overview</a></li>
                            <li class="menu-item ${req.path === '/plugins' ? 'active' : ''}"><a href="/mashroom/admin/plugins">Plugins</a></li>
                            <li class="menu-item ${req.path === '/plugin-packages' ? 'active' : ''}"><a href="/mashroom/admin/plugin-packages">Plugin Packages</a></li>
                            <li class="menu-item ${req.path === '/plugin-loaders' ? 'active' : ''}"><a href="/mashroom/admin/plugin-loaders">Plugin Loaders</a></li>
                            <li class="menu-item ${req.path === '/middleware' ? 'active' : ''}"><a href="/mashroom/admin/middleware">Middleware</a></li>
                            <li class="menu-item ${req.path === '/services' ? 'active' : ''}"><a href="/mashroom/admin/services">Services</a></li>
                            <li class="menu-item ${req.path === '/webapps' ? 'active' : ''}"><a href="/mashroom/admin/webapps">Web-Apps</a></li>
                            <li class="menu-item ${req.path === '/apis' ? 'active' : ''}"><a href="/mashroom/admin/apis">APIs</a></li>
                            <li class="menu-item ${req.path === '/server-info' ? 'active' : ''}"><a href="/mashroom/admin/server-info">Server Info</a></li>
                            ${extraMenuEntry.map(({menuTitle, path}) => `
                                  <li class="menu-item ${req.path === `/ext${path}` ? 'active' : ''}"><a href="/mashroom/admin/ext${path}">${menuTitle}</a></li>
                            `).join('')}
                        </ul>
                    </nav>
                    <main>
                        ${content}
                    </main>
                </div>

                <div id="modal" style="display: none">
                    <div class="modal-wrapper">
                        <div class="modal-header">
                            <div class="modal-close" onclick="closeModal()">x</div>
                        </div>
                        <div id="modal-content">

                        </div>
                    </div>
                </div>
            </body>
        </html>
    `;
};
