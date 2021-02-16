
import type {
    MashroomPortalPageRenderModel,
    MashroomPortalSiteLocalized
} from '../../../type-definitions';

export default (model: MashroomPortalPageRenderModel) => (`
    <!doctype html>
    <html>
        <head>
            <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

            <meta name="description" content="${model.page.description || ''}">
            <meta name="keywords" content="${model.page.keywords || ''}">

            <meta name="csrf-token" content="${model.csrfToken || ''}">

            <title>${model.portalName} - ${model.site.title} - ${model.page.title}</title>

            <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">

            ${model.portalResourcesHeader}
        </head>
        <body style="padding: 0 10px;">
            <div id="mashroom-portal-admin-app-container">
               <!-- Admin app goes here -->
            </div>

            <header>
                <h1>${model.portalName}</h1>
                <p>(No Theme)</p>
            </header>

            ${minimalNavigation(model.siteBasePath, model.site)}

            <div class="mashroom-portal-apps-container container-fluid" style="min-height: 420px">
                ${model.portalLayout}
            </div>

            <footer style="border-top: 1px solid #dee2e6">
                <div style="padding: 10px 0; text-align: center; font-size: 0.8em;">
                    Mashroom Portal Server
                </div>
            </footer>

             ${model.portalResourcesFooter}
        </body>
    </html>
`);


const minimalNavigation = (basePath: string, site: MashroomPortalSiteLocalized) => {
    const items = [];

    for (const topPage of site.pages) {
        items.push(`
          <li class="nav-item">
            <a class="nav-link active" href="${basePath}${topPage.friendlyUrl}">${topPage.title}</a>
          </li>
        `);
    }

    return `
        <ul class="nav nav-tabs">
           ${items.join('')}
        </ul>`;
};
