const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const showdown = require('showdown');
require('showdown-highlightjs-extension');
require('./showdown-toc');
require('./showdown-include');
require('./showdown-replace-version');

const serverPackageJson = require(path.resolve(__dirname, '../../../core/mashroom/package.json'));

try {
    fs.mkdirSync('./public/docs');
    fs.mkdirSync('./public/docs/html');
} catch (e) {
    // Ignore
}

async function main() {
    const markdown = fs.readFileSync(path.resolve(__dirname, '../docs/mashroom_documentation.md'), 'utf-8');

    const converter = new showdown.Converter({
        extensions: ['highlightjs', 'toc', 'showdown-include', 'showdown-replace-version'],
        parseImgDimensions: true,
        tables: true
    });
    //converter.setFlavor('github');
    const html = converter.makeHtml(markdown.toString());

    const doc = `<!doctype html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="ie=edge">
            <title>Mashroom Documentation</title>
            <link rel="stylesheet" href="../../style.css"/>
        </head>
        <body>
            ${html}
        </body>`;

    fs.writeFileSync(path.resolve(__dirname, '../public/docs/html/index.html'), doc);

    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    await page.goto('file://' + path.resolve(__dirname, '../public/docs/html/index.html'));

    const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        footerTemplate: `
          <div style="font-size: 8px;margin: 0 auto;">Mashroom Server ${serverPackageJson.version} Documentation</div>
        `,
        margin: {
            left: '10px',
            top: '20px',
            right: '10px',
            bottom: '50px'
        }
    });
    fs.writeFileSync(path.resolve(__dirname, '../public/docs/mashroom_documentation.pdf'), pdf);

    await browser.close();
}

main();

