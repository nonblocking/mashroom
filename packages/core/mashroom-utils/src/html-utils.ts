
export const escapeHtml = (html: string) => {
    return html
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

export const jsonToHtml = (obj: any): string => {
    let json = JSON.stringify(obj, null, '  ');
    json = escapeHtml(json);
    json = json.replace(/ /g, '&nbsp;');
    json = json.replace(/\n/g, '<br/>');
    return json;
};
