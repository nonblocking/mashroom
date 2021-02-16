
import {promisify} from 'util';
import getUriCbStyle from 'get-uri';
import type {ReadStream} from 'fs';

const getUri = promisify(getUriCbStyle);

export const getResourceAsStream = async (resourceUri: string): Promise<ReadStream> => {
    // @ts-ignore
    return getUri(resourceUri)
};

export const getResourceAsString = async (resourceUri: string): Promise<string> => {
    const stream = await getResourceAsStream(resourceUri);
    return new Promise((resolve, reject) => {
        const chunks: Array<Buffer> = [];
        stream.on('data', (chunk) => chunks.push(chunk as Buffer));
        stream.on('error', (error) => reject(error));
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    })
};
