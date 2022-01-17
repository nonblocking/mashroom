const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const showdown = require('showdown');
const showdownHighlight = require('showdown-highlight');
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
        extensions: [showdownHighlight, 'toc', 'showdown-include', 'showdown-replace-version'],
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

            <div id="toc-menu" style="display: none">&#9776;</div>
            <div id="toc-wrapper"></div>
            <style>
                #toc-menu {
                    display: none;
                    position: fixed;
                    top: 30px;
                    left: 0;
                    padding: 5px;
                    cursor: pointer;
                    border: 1px solid #aaa;
                    box-shadow: 0 0 2px #aaa;
                    background-color: white;
                }

                #toc-wrapper {
                    display: none;
                    background-color: white;
                    padding: 10px;
                    border: 1px solid #aaa;
                    max-width: 30%;
                    position: fixed;
                    top: 0;
                    left: 0;
                    overflow-y: scroll;
                    height: 100%;
                }
            </style>
            <script>
                const tocMenu = document.getElementById('toc-menu');
                const tocWrapper = document.getElementById('toc-wrapper');
                tocMenu.addEventListener('click', (e) => {
                    e.stopPropagation();
                    tocWrapper.style.display = 'block';
                    tocMenu.style.display = 'none';
                });
                tocWrapper.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (e.target instanceof HTMLAnchorElement) {
                    tocWrapper.style.display = 'none';
                    tocMenu.style.display = 'block';
                    }
                });
                document.addEventListener('click', (e) => {
                    if (tocWrapper.style.display === 'block' && e.screenX > tocWrapper.clientWidth) {
                        tocWrapper.style.display = 'none';
                        tocMenu.style.display = 'block';
                    }
                })
                const [toc] = document.getElementsByClassName('toc');
                tocWrapper.innerHTML = toc.innerHTML;
                if (toc) {
                    const { clientHeight: tocHeight } = toc;
                    window.addEventListener('scroll', () => {
                      if (window.scrollY > (toc.offsetTop + tocHeight)) {
                          tocMenu.style.display = 'block';
                      } else {
                          tocMenu.style.display = 'none';
                      }
                    });
                    if (window.scrollY > (toc.offsetTop + tocHeight)) {
                      tocMenu.style.display = 'block';
                    }
                }
            </script>
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
            <div style="width: 85%;margin: 0 auto; display: flex;">
                  <div style="font-size: 8px;flex-grow: 2">Mashroom Server ${serverPackageJson.version}</div>
                  <div style="font-size: 8px;">Page <span class="pageNumber">1</span>/<span class="totalPages">2</span></div>
            </div>
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

