
import type {Request} from 'express';

export default (content: string, req: Request) => (`
    <!doctype html>
    <head>
        <title>Mashroom Administration</title>
        <style type="text/css">
            body {
                margin: 15px;
                padding: 0;
                font-family: 'Helvetica Neue', Helvetica, Roboto, Arial, sans-serif;
            }

            h1 {
                color: #645e9d;
                font-family: Georgia, serif;
                margin: 10px 0 15px 0;
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

            nav ul {
                display: flex;
                padding: 0;
                margin: 0;
            }

            .menu-item {
                list-style-type: none;
                padding: 5px 10px;
                margin: 0 5px 0 0;
                border-bottom: 2px solid transparent;
                background-color: #EFEFEF;
            }

            .menu-item a {
                color: #444;
                text-decoration: none;
            }

            .menu-item a:hover, .menu-item a:active {
                color: black;
            }

            .menu-item.active {
                border-color: #0097cc;
            }

            .menu-item.active a {
                color: black;
                font-weight: bold;
                text-decoration: none;
                cursor: default;
            }

            .menu-item.external {
                background: none;
                margin-left: 5px;
            }

            .menu-item.external a {
                text-decoration: underline;
            }

            main {
                margin: 25px 0;
            }

            main ul {
                margin: 0;
            }

            main li {
                padding: 3px 0;
            }

            table, th, td {
                border: 1px solid #CCC;
            }

            table {
                border-spacing: 0;
                border-collapse: collapse;
            }

            td {
                padding: 6px 10px;
                line-height: 1.25em;
            }

            th {
                background-color: #EFEFEF;
                padding: 8px 10px;
                text-align: left;
                vertical-align: top;
                white-space: nowrap;
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
            }, 10000);

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
        <h1>Mashroom Administration</h1>
        <nav>
            <ul>
                <li class="menu-item ${req.path === '/' ? 'active' : ''}"><a href="/mashroom/admin">Overview</a></li>
                <li class="menu-item ${req.path === '/plugins' ? 'active' : ''}"><a href="/mashroom/admin/plugins">Plugins</a></li>
                <li class="menu-item ${req.path === '/middleware' ? 'active' : ''}"><a href="/mashroom/admin/middleware">Middleware</a></li>
                <li class="menu-item ${req.path === '/services' ? 'active' : ''}"><a href="/mashroom/admin/services">Services</a></li>
                <li class="menu-item ${req.path === '/webapps' ? 'active' : ''}"><a href="/mashroom/admin/webapps">Webapps</a></li>
                <li class="menu-item external"><a href="/mashroom/docs" target="_blank">Documentation</a></li>
            </ul>
        </nav>
        <main>
            ${content}
        </main>
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
`);
