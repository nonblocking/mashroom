
const showdown = require('showdown');
const cheerio = require('cheerio');

// Taken from https://github.com/JanLoebel/showdown-toc/blob/master/src/showdown-toc.js

showdown.extension('toc', () => {

    function getHeaderEntries(sourceHtml) {
        return getHeaderEntriesInNodeJs(sourceHtml);
    }

    function getHeaderEntriesInNodeJs(sourceHtml) {
        var $ = cheerio.load(sourceHtml);
        var headers = $('h2, h3, h4');

        var headerList = [];
        for (var i = 0; i < headers.length; i++) {
            var el = headers[i];
            if ($(el).text().toLowerCase() === 'table of contents') {
                continue;
            }
            headerList.push(new TocEntry(el.name, $(el).text(), $(el).attr('id')));
        }

        return headerList;
    }

    function TocEntry(tagName, text, anchor) {
        this.tagName = tagName;
        this.text = text;
        this.anchor = anchor;
        this.children = [];
    }

    TocEntry.prototype.childrenToString = function() {
        if (this.children.length === 0) {
            return "";
        }
        var result = "<ul>\n";
        for (var i = 0; i < this.children.length; i++) {
            result += this.children[i].toString();
        }
        result += "</ul>\n";
        return result;
    };

    TocEntry.prototype.toString = function() {
        var result = "<li>";
        if (this.text) {
            result += "<a href=\"#" + this.anchor + "\">" + this.text + "</a>";
        }
        result += this.childrenToString();
        result += "</li>\n";
        return result;
    };

    function sortHeader(tocEntries, level) {
        level = level || 2;
        var tagName = "H" + level,
            result = [],
            currentTocEntry;

        function push(tocEntry) {
            if (tocEntry !== undefined) {
                if (tocEntry.children.length > 0) {
                    tocEntry.children = sortHeader(tocEntry.children, level + 1);
                }
                result.push(tocEntry);
            }
        }

        for (var i = 0; i < tocEntries.length; i++) {
            var tocEntry = tocEntries[i];
            if (tocEntry.tagName.toUpperCase() !== tagName) {
                if (currentTocEntry === undefined) {
                    currentTocEntry = new TocEntry();
                }
                currentTocEntry.children.push(tocEntry);
            } else {
                push(currentTocEntry);
                currentTocEntry = tocEntry;
            }
        }

        push(currentTocEntry);
        return result;
    }

    return {
        type: 'output',
        filter: (sourceHtml) => {
            var headerList = getHeaderEntries(sourceHtml);

            // No header found
            if (headerList.length === 0) {
                return sourceHtml;
            }

            // Sort header
            headerList = sortHeader(headerList);

            // Build result and replace all [toc]
            var result = '<div class="toc">\n<ul>\n' + headerList.join("") + '</ul>\n</div>\n';
            return sourceHtml.replace(/\[toc\]/gi, result);
        }
    };
});
