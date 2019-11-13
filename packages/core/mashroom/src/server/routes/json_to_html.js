// @flow

export default (obj: any) => {
    const json = JSON.stringify(obj, null, '  ');
    return json
        .replace(/ /g, '&nbsp;')
        .replace(/\n/g, '<br/>');
};
