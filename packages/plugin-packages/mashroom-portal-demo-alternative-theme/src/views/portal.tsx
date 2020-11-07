
import React from 'react';
import Navigation from './navigation';
import themeParams from '../plugin/theme_params';
import type {MashroomPortalPageRenderModel} from '@mashroom/mashroom-portal/type-definitions'

export default ({
                    user, site, siteBasePath, page, csrfToken, resourcesBasePath, apiBasePath,
                    portalResourcesHeader, portalResourcesFooter, portalLayout, messages
                }: MashroomPortalPageRenderModel) => (
    <html>
        <head dangerouslySetInnerHTML={{ __html: `
            <meta httpEquiv="X-UA-Compatible" content="IE=edge"/>
            <meta charSet="utf-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>

            <meta name="description" content="${page.description}"/>
            <meta name="keywords" content="${page.keywords}"/>

            ${csrfToken ? `<meta name="csrf-token" content="${csrfToken}" />` : ''}

            <title>${site.title} - ${page.title}</title>

            <link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet' type='text/css'/>
            <link href='https://fonts.googleapis.com/css?family=Domine' rel='stylesheet' type='text/css'/>
            <link rel="stylesheet" type="text/css" href='${resourcesBasePath}/bootstrap/css/bootstrap.css'/>
            <link rel="stylesheet" type="text/css" href='${resourcesBasePath}/fontawesome/css/regular.css'/>
            <link rel="stylesheet" type="text/css" href='${resourcesBasePath}/fontawesome/css/solid.css'/>
            <link rel="stylesheet" type="text/css" href='${resourcesBasePath}/style.css'/>

            ${page.extraCss ? `<style type="text/css">${page.extraCss}</style>` : ''}

            ${portalResourcesHeader}
        `}} />
        <body>
            <div id="mashroom-portal-admin-app-container">
                {/* Admin app goes here */}
            </div>

            <header>
                <div className="logo">
                    <img src={`${resourcesBasePath}/assets/mashroom_logo.svg`} />
                </div>
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
                <div id="menu-open" />
            </header>

            <main>
                <Navigation siteBasePath={siteBasePath} currentPage={page} pages={site.pages} />

                <div className="mashroom-portal-apps-container container-fluid">
                    <div dangerouslySetInnerHTML={{__html: portalLayout}}/>
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
                    Powered by: <a href="https://www.mashroom-server.com" target="_blank">Mashroom Portal Server</a> {themeParams.mashroomVersion}
                </div>
            </footer>

            <span dangerouslySetInnerHTML={{__html: portalResourcesFooter}}/>

            <script dangerouslySetInnerHTML={{__html: `
                document.getElementById('menu-open').addEventListener('click', toggleMenu);

                function toggleMenu() {
                    var nav = document.querySelector('nav');
                    if (nav.classList.contains('show')) {
                        nav.classList.remove('fade-in');
                        setTimeout(() => {
                            nav.classList.remove('show');
                        }, 200);
                    } else {
                        nav.classList.add('show');
                        setTimeout(() => {
                            nav.classList.add('fade-in');
                        }, 10);
                    }
                }
            `}} />
        </body>
    </html>
);
