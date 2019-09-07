// @flow

import type {ExpressRequest} from '../../../type-definitions';

export default (content: string, req: ExpressRequest) => (`
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
            }
            
            h2 {
                font-size: 1.2em;
                font-family: Georgia, serif;
            }
            
            pre {
                font-family:  Consolas, 'Liberation Mono', Courier, monospace;
            }
            
            a {
                color: #645e9d;
                text-decoration: none;
            }
    
            a:hover {
                color: #36346e;
            }
        
            nav ul {
                display: flex; 
                padding: 0;
                border-bottom: 1px solid #888;
                max-width: 800px;
            }
        
            .menu-item {
                list-style-type: none;
                padding: 3px 10px;
                margin: 0 5px;
            }
            
            .menu-item a {
                color: #444;
            }
         
            .menu-item a:hover, .menu-item a:active {
                color: black;
            }
            
            .menu-item.active {
                border-bottom: 2px solid #0097cc;
                margin-bottom: -1px;
            }
            
            .menu-item.active a {
                color: black;
                font-weight: bold;
                text-decoration: none;
                cursor: default;
            }
            
            th {
                text-align: left;
                vertical-align: top;
                white-space: nowrap;
            }
            
            main {
                margin: 30px 0;
            }
            
            main ul {
                margin: 0;
            }
            
            main li {
                padding: 3px 0;
            }
        </style>
    </head>
    <html>
        <h1>Mashroom Administration</h1>
        <nav>
            <ul>
                <li class="menu-item ${req.path === '/mashroom' ? 'active' : ''}"><a href="/mashroom">Overview</a></li>
                <li class="menu-item ${req.path === '/mashroom/plugins' ? 'active' : ''}"><a href="/mashroom/plugins">Plugins</a></li>
                <li class="menu-item ${req.path === '/mashroom/middleware' ? 'active' : ''}"><a href="/mashroom/middleware">Middleware</a></li>
                <li class="menu-item ${req.path === '/mashroom/services' ? 'active' : ''}"><a href="/mashroom/services">Services</a></li>
                <li class="menu-item ${req.path === '/mashroom/webapps' ? 'active' : ''}"><a href="/mashroom/webapps">Webapps</a></li>
                <li class="menu-item "><a href="/mashroom/docs" target="_blank">Documentation</a></li>
            </ul>
        </nav>
        <main>
            ${content}
        </main>
    </html>
`);
