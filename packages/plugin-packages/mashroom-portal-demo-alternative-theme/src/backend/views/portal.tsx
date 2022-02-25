
import {readFileSync} from 'fs';
import {resolve} from 'path';
import React from 'react';
import Navigation from './navigation';
import themeParams from '../plugin/theme_params';
import packageJson from '../../package.json';

import type {MashroomPortalPageRenderModel} from '@mashroom/mashroom-portal/type-definitions'

const fontawesomeVersion = packageJson.devDependencies['@fortawesome/fontawesome-free']?.replace(/[^]/, '');

const inlineStyle = (cssFile: string): string => {
    try {
        const file = readFileSync(resolve(__dirname, '../public', cssFile));
        return `<style>${file.toString('utf-8')}</style>`;
    } catch (e) {
        return `<!-- Error: CSS file not found: ${cssFile} -->`;
    }
}

const inlineSVG = (assetFile: string): string => {
    try {
        const file = readFileSync(resolve(__dirname, '../public/assets', assetFile));
        return file.toString('utf-8');
    } catch (e) {
        return `<!-- Error: SVG file not found: ${assetFile} -->`;
    }
}

export default ({
                    user, site, siteBasePath, page, lang, csrfToken, resourcesBasePath, apiBasePath,
                    portalResourcesHeader, portalResourcesFooter, pageContent, messages, lastThemeReloadTs
                }: MashroomPortalPageRenderModel) => (
    <html lang={lang}>
        <head dangerouslySetInnerHTML={{ __html: `
            <meta httpEquiv="X-UA-Compatible" content="IE=edge"/>
            <meta charSet="utf-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>

            <meta name="description" content="${page.description}"/>
            <meta name="keywords" content="${page.keywords}"/>

            ${csrfToken ? `<meta name="csrf-token" content="${csrfToken}" />` : ''}

            <title>${site.title} - ${page.title}</title>

            <link href='https://fonts.googleapis.com/css?family=Roboto' rel='prefetch stylesheet' type='text/css'/>
            <link href='https://fonts.googleapis.com/css?family=Domine' rel='prefetch stylesheet' type='text/css'/>
            <link rel="stylesheet" type="text/css" href='${resourcesBasePath}/fontawesome/css/regular.css?v=${fontawesomeVersion}'/>
            <link rel="stylesheet" type="text/css" href='${resourcesBasePath}/fontawesome/css/solid.css?v=${fontawesomeVersion}'/>
            <link rel="stylesheet" type="text/css" href='${resourcesBasePath}/fontawesome/css/brands.css?v=${fontawesomeVersion}'/>

            ${inlineStyle('portal.css')}
            ${user.admin ? `<link rel="stylesheet" type="text/css" href='${resourcesBasePath}/admin.css?v=${lastThemeReloadTs}'/>` : ''}

            ${portalResourcesHeader}

            ${page.extraCss ? `<style >${page.extraCss}</style>` : ''}

            <script type="application/javascript" src="${resourcesBasePath}/main.js?v={{${lastThemeReloadTs}"></script>
        `}} />
        <body>
            {user.admin && (
                <div id="mashroom-portal-admin-app-container">
                    {/* Admin app goes here */}
                </div>
            )}
            <header>
                <div className="logo" dangerouslySetInnerHTML={{__html: inlineSVG('logo-red.svg')}} />
                <div className="site-name">
                    <h1>{site.title}</h1>
                </div>
                {!user.guest && (
                    <div className="user">
                        <div className="user-name">
                            {user.displayName}
                        </div>
                        <div className="logout">
                            <a href={`${apiBasePath}/logout`}>{messages('logout')}</a>
                        </div>
                    </div>
                )}
            </header>

            <Navigation siteBasePath={siteBasePath} currentPage={page} pages={site.pages} />

            <main>
                <div id="portal-page-content" className="mashroom-portal-apps-container container-fluid">
                    <div dangerouslySetInnerHTML={{__html: pageContent}}/>
                </div>
            </main>


            <div id="mashroom-portal-modal-overlay">
                <div className="mashroom-portal-modal-overlay-wrapper">
                    <div className="mashroom-portal-modal-overlay-header">
                        <div id="mashroom-portal-modal-overlay-title">Title</div>
                        <div id="mashroom-portal-modal-overlay-close" className="close-button" />
                    </div>
                    <div className="mashroom-portal-modal-overlay-content">
                        <div id="mashroom-portal-modal-overlay-app">
                            {/* Modal apps go here */}
                        </div>
                    </div>
                </div>
            </div>

            <div id="mashroom-portal-auth-expires-warning">
                <div className="mashroom-portal-auth-expires-warning-message">
                    {messages('authenticationExpiresWarning')}
                </div>
            </div>

            <footer>
                <div className="powered-by">
                    Powered by: <a href="https://www.mashroom-server.com" rel="noopener" target="_blank">Mashroom Portal Server</a> {themeParams.mashroomVersion}
                </div>
            </footer>

            <span dangerouslySetInnerHTML={{__html: portalResourcesFooter}}/>

            <script dangerouslySetInnerHTML={{__html: `

            `}} />
        </body>
    </html>
);
