
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
        <head>
            <title>Mashroom Administration</title>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                }

                h1 {
                    font-size: 1.4em;
                    font-family: 'Lucida Grande', 'Lucida Sans Unicode', sans-serif;
                }

                h2 {
                    font-size: 1.2em;
                    font-family: 'Lucida Grande', 'Lucida Sans Unicode', sans-serif;
                    margin: 20px 0;
                }

                pre, .json, .console {
                    font-family:  Consolas, 'Liberation Mono', Courier, monospace;
                }

                a {
                    color: #504B88;
                    text-decoration: none;
                }

                a:hover {
                    color: #3d3967;
                }

                header {
                    background-color: #504B88;
                    display: flex;
                }

                header h1 {
                    color: white;
                    font-weight: normal;
                    margin: auto 0;
                }

                header .logo {
                    padding: 10px 25px 8px 25px;
                }

                #content-wrapper {
                    display: flex;
                }

                nav ul {
                    padding: 0;
                    margin: 20px 0;
                    background-color: #f4f3f8;
                }

                .menu-item {
                    position: relative;
                    list-style-type: none;
                    padding: 7px 25px;
                    border-top: 1px solid white;
                    border-bottom: 1px solid white;
                }

                .menu-item a {
                    color: black;
                    text-decoration: none;
                    white-space: nowrap;
                }

                .menu-item a:hover:before {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 4px;
                    height: 100%;
                    content: ' ';
                    display: block;
                    background-color: #C49B5E;
                }

                .menu-item.active:before {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 4px;
                    height: 100%;
                    content: ' ';
                    display: block;
                    background-color: #504B88;
                }

                .menu-item.active a {
                    color: black;
                    font-weight: bold;
                    text-decoration: none;
                    cursor: default;
                }

                .menu-item.external a {
                    text-decoration: underline;
                }

                main {
                    margin: 0;
                    padding: 5px 30px;
                    overflow-x: auto;
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
                    font-weight: normal;
                    font-family: 'Lucida Grande', 'Lucida Sans Unicode', sans-serif;
                    font-size: 1.05em;
                }

                td {
                    padding: 8px 10px;
                    line-height: 1.25em;
                    vertical-align: top;
                }

                tr:nth-child(even) {
                    background-color: #f4f3f8;
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

            <script type="application/javascript">
                var refreshTimer = setTimeout(function() {
                    window.location.reload();
                }, 30000);

                function cancelRefresh() {
                    clearTimeout(refreshTimer);
                }

                function openModal(content) {
                    cancelRefresh();
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
            </script>
        </head>
        <html>
            <header>
                <div class="logo">
                   <svg width="40" height="40" viewBox="0 0 250 190" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 72.0771C0 70.7653 0.580079 69.5203 1.5854 68.6744L81.9425 1.05795C84.8452 -1.38445 89.2857 0.673238 89.2857 4.46067V116.796C89.2857 118.095 88.7168 119.329 87.7281 120.175L7.37091 188.918C4.47539 191.395 0 189.344 0 185.539V72.0771Z" fill="white"/>
                        <path d="M80.3571 72.0771C80.3571 70.7653 80.9372 69.5203 81.9425 68.6744L162.3 1.05795C165.202 -1.38445 169.643 0.673238 169.643 4.46067V116.796C169.643 118.095 169.074 119.329 168.085 120.175L87.7281 188.918C84.8325 191.395 80.3571 189.344 80.3571 185.539V72.0771Z" fill="white"/>
                        <path d="M160.714 72.0771C160.714 70.7653 161.294 69.5203 162.3 68.6744L242.657 1.05795C245.559 -1.38445 250 0.673238 250 4.46067V116.796C250 118.095 249.431 119.329 248.442 120.175L168.085 188.918C165.19 191.395 160.714 189.344 160.714 185.539V72.0771Z" fill="white"/>
                    </svg>
                </div>
                <h1>Mashroom Server Admin UI</h1>
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
        </html>
    `;
};
