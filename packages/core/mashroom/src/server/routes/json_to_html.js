// @flow

import escapeHtml from './escape_html';

export default (obj: any): string => {
    let json = JSON.stringify(obj, null, '  ');
    json = escapeHtml(json);
    json = json.replace(/ /g, '&nbsp;');
    json = json.replace(/\n/g, '<br/>');
    return json;
};
