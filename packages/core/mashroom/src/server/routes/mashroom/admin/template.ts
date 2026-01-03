
import type {Request} from 'express';

export default (content: string, req: Request) => {
    const adminIntegrationPlugins = [...req.pluginContext.services.core.pluginService.getPlugins().filter((p) => p.type === 'admin-ui-integration' && !!p.config?.menuTitle)];
    adminIntegrationPlugins.sort((p1, p2) => p1.config?.order - p2.config?.order);

    const extraMenuEntry = adminIntegrationPlugins.map(({config}) => ({
        menuTitle: config?.menuTitle || '???',
        path: config?.path || '???',
    }));

    return `
        <!doctype html>
        <html lang="en">
            <head>
                <title>Mashroom Administration</title>
                <link sizes="16x16 32x32" type="image/x-icon" rel="icon" href="data:image/vnd.microsoft.icon;base64,AAABAAEAIBgAAAEAIACIDAAAFgAAACgAAAAgAAAAMAAAAAEAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/SE3kf0hNZn1GTQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/SE4Af0hNon9ITaB/SE0IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH9ITVt/SE3Pf0hNIQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH9ITf9/SE3+f0hNjH5ITQQAAAAAAAAAAAAAAAAAAAAAAAAAAH9ITgB/SE22f0hN/39ITcJ/SE0WBgICAAAAAAAAAAAAAAAAAAAAAAAAAAAAf0hNbn9ITf9/SE3nf0hNOoFHTQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf0hN/39ITf9/SE3/f0hNsH9ITQ4AAAAAAAAAAAAAAAAAAAAAf0hOAH9ITbZ/SE3/f0hN/39ITdx/SE0rAAAAAAAAAAAAAAAAAAAAAAAAAAB/SE1uf0hN/39ITf9/SE31f0hNWoJITwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/SE3/f0hN/39ITf9/SE3/f0hNz39ITR8DAQEAAAAAAAAAAAB/SE4Af0hNtn9ITf9/SE3/f0hN/39ITe5/SE1HgklPAAAAAAAAAAAAAAAAAH9ITW5/SE3/f0hN/39ITf9/SE39f0hNgH9JTQIAAAAAAAAAAAAAAAAAAAAAAAAAAH9ITf9/SE3/f0hN/39ITf9/SE3/f0hN5X9ITTd/R00AAAAAAH9ITgB/SE22f0hN/39ITf9/SE3/f0hN/39ITfp/SE1qgEpOAQAAAAAAAAAAf0hNbn9ITf9/SE3/f0hN/39ITf9/SE3/f0hNpn9ITAoAAAAAAAAAAAAAAAAAAAAAf0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN9H9ITVd+SE8Af0hOAH9ITbZ/SE3/f0hN/39ITf9/SE3/f0hN/39ITf5/SE2Rf0hNBQAAAAB/SE1uf0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hNxn9ITRgLBAQAAAAAAAAAAAB/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/H9ITXx/SU0Cf0hNtn9ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE21f0hND39ITW5/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN339ITS5+SE8AAAAAAH9ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITaJ/SE2+f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3Sf0hNj39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN8H9ITUyMXwEAf0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf5/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3+f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN+39ITW5/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/X9ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE2Pf0hN/n9ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/35JTQB/SE1nf0hN+H9ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hNn39ITeN/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITcZ/SE27f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/AAAAAH9ORAB/SE1Bf0hN6n9ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE1uf0hNG39ITch/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE3/f0hNtn9ITQZ/SE2Uf0hN/n9ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITf8AAAAAAAAAAAAAAAB/SE0kf0hN039ITf9/SE3/f0hN/39ITf9/SE3/f0hN/39ITW4AAAAAf0hNCn9ITaV/SE3/f0hN/39ITf9/SE3/f0hN/39ITf9/SE22f0hOAH9ITQF/SE1rf0hN+X9ITf9/SE3/f0hN/39ITf9/SE3/f0hN/wAAAAAAAAAAAAAAAAAAAAB/SE0Qf0hNtH9ITf9/SE3/f0hN/39ITf9/SE3/f0hNbgAAAAAAAAAAgEdNAn9ITXt/SE38f0hN/39ITf9/SE3/f0hN/39ITbZ/SE4AAAAAAH1FTQB/SE1Ff0hN7H9ITf9/SE3/f0hN/39ITf9/SE3/AAAAAAAAAAAAAAAAAAAAAAAAAACASEwEf0hNjH9ITf5/SE3/f0hN/39ITf9/SE1uAAAAAAAAAAAAAAAAgktOAH9ITVN/SE3yf0hN/39ITf9/SE3/f0hNtn9ITgAAAAAAAAAAAAAAAAB/SE0nf0hN1n9ITf9/SE3/f0hN/39ITf8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB7RkoAf0hNY39ITfd/SE3/f0hN/39ITW4AAAAAAAAAAAAAAAAAAAAAAAAAAH9ITTF/SE3gf0hN/39ITf9/SE22f0hOAAAAAAAAAAAAAAAAAAAAAAB/SE0Rf0hNt39ITf9/SE3/f0hN/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB6SEsAf0hNPn9ITeh/SE3/f0hNbgAAAAAAAAAAAAAAAAAAAAAAAAAADQQFAH9ITRl/SE3Ff0hN/39ITbZ/SE4AAAAAAAAAAAAAAAAAAAAAAAAAAAB+SE0Ff0hNkH9ITf5/SE3/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf0hNIn9ITc9/SE1bAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH9ITQl/SE2gf0hNo39ITQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/SE4Bf0hNZ39ITeQ/x/H/D8Pw/wfB8H8DwPAfAcAwDwDAEAcAAAADAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAMAAAADgCAIA8AwDgPgPA8D+D4Pg/w/D8P+P4/g=">
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
                        margin: 0 0 16px 0;
                    }

                    pre, .json, .console {
                        font-family: Consolas, 'Liberation Mono', Courier, monospace;
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

                    a.long {
                        word-break: break-all;
                    }

                    input[type="text"], input[type="number"], input[type="password"], input[type="tel"], input[type="search"] {
                        padding: 8px 12px;
                        border: 1px solid #AAA;
                        font-size: 1em;
                        width: 100%;

                        &:focus {
                            outline: 1px solid #AAA;
                        }

                        &:invalid {
                            border: 1px solid red;
                        }

                        &:disabled {
                            cursor: not-allowed;
                            color: gray !important;
                        }
                    }

                    header {
                        background-color: #4D487F;
                        border-bottom: 2px solid #d3b486;
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
                        margin: 16px 8px;
                        border-radius: 8px;
                    }

                    .menu-item {
                        list-style-type: none;
                        overflow: hidden;

                        &:first-child {
                            border-top-left-radius: 8px;
                            border-top-right-radius: 8px;
                        }

                        &:last-child {
                            border-bottom-left-radius: 8px;
                            border-bottom-right-radius: 8px;
                        }
                    }

                    .menu-item a {
                        display: inline-block;
                        width: 100%;
                        color: black;
                        text-decoration: none;
                        white-space: nowrap;
                        padding: 7px 21px;
                        background-color: #fafafa;
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
                        margin: 16px 8px;
                        padding: 16px;
                        overflow: hidden;
                        width: 100%;
                        background-color: white;
                        border-radius: 8px;
                    }

                    main ul {
                        margin: 0;
                    }

                    main li {
                        padding: 3px 0;
                    }

                    iframe {
                        margin: -16px;
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
                        background-color: #FAFAFA;
                    }

                    table.overview th {
                        font-weight: normal;
                    }

                    .details-link {
                        padding: 20px 0;
                        margin-bottom: 40px;
                    }

                    .admin-ui-integration-wrapper {
                        width: 100%;
                    }

                    .table-filter {
                        max-width: 450px;
                        margin-bottom: 5px;
                    }

                    #table-filter-result {
                        margin-top: 10px;
                        font-style: italic;
                    }

                    .hidden {
                        display: none;
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
                        border-radius: 8px;
                    }

                    #modal .modal-header {
                        position: relative;
                        width: 100%;
                        border-top-left-radius: 8px;
                        border-top-right-radius: 8px;
                    }

                    #modal .modal-header .modal-close {
                        position: absolute;
                        right: 16px;
                        top: 16px;
                        color: #666;
                        cursor: pointer;
                    }

                    #modal .modal-header .modal-close:hover {
                        color: black;
                    }

                    #modal-content {
                        min-width: 250px;
                        min-height: 250px;
                        padding: 32px 16px 16px 16px;
                        border-bottom-left-radius: 8px;
                        border-bottom-right-radius: 8px;
                    }
                </style>

                <script type="text/javascript">
                    const refreshEnabled = document.cookie.split('; ').find(function(keyValue) {
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

                    function filterTable(tableElemId, filterResultElemId, filterValue) {
                        const table = document.getElementById(tableElemId);
                        const tableRows = table.getElementsByTagName('tr');
                        const filterResult = document.getElementById(filterResultElemId);
                        let matches = 0;

                        // Update query
                        const url = new URL(window.location);
                        if (filterValue) {
                             url.searchParams.set('q', filterValue);
                        } else {
                            url.searchParams.delete('q');
                        }
                        history.pushState(null, '', url);

                        for (let i = 1; i < tableRows.length; i++) {
                            const row = tableRows[i];
                            if (!filterValue || filterValue.length < 3 || row.innerHTML.toLowerCase().indexOf(filterValue.toLowerCase()) !== -1) {
                                matches ++;
                                row.style.display = 'table-row';
                            } else {
                                row.style.display = 'none';
                            }
                        }

                        if (!query || tableRows.length < 2) {
                            filterResult.innerHTML = '';
                        } else if (!matches) {
                            filterResult.innerHTML = 'No matches found';
                        } else {
                            filterResult.innerHTML = 'Showing ' +  matches + ' matches (out of ' + tableRows.length + ')';
                        }
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
                            <li class="menu-item"><a href="https://docs.mashroom-server.com" target="_blank">Documentation</a></li>
                        </ul>
                    </nav>
                    <main>
                        ${content}
                    </main>
                </div>

                <div id="modal" style="display: none">
                    <div class="modal-wrapper">
                        <div class="modal-header">
                            <div class="modal-close" onclick="closeModal()">&#x2715;</div>
                        </div>
                        <div id="modal-content">

                        </div>
                    </div>
                </div>
            </body>
        </html>
    `;
};
