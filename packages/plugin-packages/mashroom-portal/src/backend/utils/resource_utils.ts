
import getUri from 'get-uri';
import type {Readable} from 'stream';

export const getResourceAsStream = async (resourceUri: string): Promise<Readable> => {
    return getUri(resourceUri);
};

export const getResourceAsString = async (resourceUri: string): Promise<string> => {
    const stream = await getResourceAsStream(resourceUri);
    return new Promise((resolve, reject) => {
        const chunks: Array<Buffer> = [];
        stream.on('data', (chunk) => chunks.push(chunk as Buffer));
        stream.on('error', (error) => reject(error));
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
};
