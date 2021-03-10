
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
            <style type="text/css">
                body {
                    margin: 0;
                    padding: 0;
                    font-family: 'Helvetica Neue', Helvetica, Roboto, Arial, sans-serif;
                }

                h1 {
                    font-size: 1.4em;
                    font-family: Georgia, serif;
                }

                h2 {
                    font-size: 1.2em;
                    font-family: Georgia, serif;
                    margin: 20px 0;
                }

                pre, .json, .console {
                    font-family:  Consolas, 'Liberation Mono', Courier, monospace;
                }

                a {
                    color: #645e9d;
                }

                a:hover {
                    color: #36346e;
                }

                header {
                    background-color: #645e9d;
                    display: flex;
                }

                header h1 {
                    color: white;
                    margin-top: 22px;
                }

                header .logo {
                    padding: 20px;
                }

                header .logo svg {
                    height: 30px;
                }

                #content-wrapper {
                    display: flex;
                }

                nav ul {
                    padding: 20px 0;
                    margin: 0;
                    background-color: #EFEFEF;
                }

                .menu-item {
                    list-style-type: none;
                    padding: 7px 25px;
                    border-top: 1px solid white;
                    border-bottom: 1px solid white;
                }

                .menu-item a {
                    color: #444;
                    text-decoration: none;
                    white-space: nowrap;
                }

                .menu-item a:hover, .menu-item a:active {
                    color: black;
                }

                .menu-item.active {
                    background-color: white;
                    border-top: 1px solid #AAA;
                    border-bottom: 1px solid #AAA;
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
                    padding: 10px 30px;
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
                    border-bottom: 1px solid #666;
                    font-weight: normal;
                    font-family: Georgia, serif;
                    font-size: 1.05em;
                }

                td {
                    padding: 8px 10px;
                    line-height: 1.25em;
                    border-bottom: 1px solid #AAA;
                    vertical-align: top;
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
                    margin: 15% auto;
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
                    <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 269.4 270">
                        <defs>
                            <style>
                                .cls-1{fill:white;}.cls-2,.cls-3{fill:none;stroke-miterlimit:10;}.cls-2{stroke:white;stroke-width:0.5px;}.cls-3{stroke:white;stroke-width:20px;}
                            </style>
                        </defs>
                        <title>mashroom_logo</title>
                        <path class="cls-1"
                              d="M98.16,58.35h27.65v88.31q0,13,6.67,13,8.27,0,8.27-21.41V58.35h27.41V180.8H142V169.45q-5.21,13.1-16.23,13.28v35.62H98.16Z"
                              transform="translate(-0.64 -0.4)"/>
                        <path class="cls-2" d="M116.87,124.37" transform="translate(-0.64 -0.4)"/>
                        <rect class="cls-3" x="10" y="10" width="249.4" height="250"/>
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
                        <li class="menu-item ${req.path === '/webapps' ? 'active' : ''}"><a href="/mashroom/admin/webapps">Webapps</a></li>
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
    `
};
