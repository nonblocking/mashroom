
import {createReadStream} from 'fs';
import {stat} from 'fs/promises';
import {fileURLToPath} from 'url';
import {Readable} from 'stream';
import http from 'http';
import https from 'https';
import ResourceFetchError from './ResourceFetchError';
import ResourceTypeNotSupportedError from './ResourceTypeNotSupportedError';
import ResourceNotFoundError from './ResourceNotFoundError';
import ResourceFetchAbortedError from './ResourceFetchAbortedError';

import type {IncomingMessage, RequestOptions, Agent as HttpAgent} from 'http';
import type {Agent as HttpsAgent} from 'https';

type GetResourceOptions = {
    readonly abortSignal: AbortSignal | null | undefined;
    readonly httpAgent?: HttpAgent;
    readonly httpsAgent?: HttpsAgent;
}

type Resource = {
    readonly size: number | null;
    readonly contentType: string | null;
    readonly lastModified: Date | null;
    readonly stream: NodeJS.ReadableStream;
}

const createFileStream = async (filePath: string, options: GetResourceOptions): Promise<Resource> => {
    try {
        const {size, mtime} = await stat(filePath);
        const stream = createReadStream(filePath, {
            autoClose: true,
            signal: options.abortSignal || undefined,
        });
        return {
            size,
            contentType: null,
            lastModified: mtime,
            stream,
        };
    } catch (e: any) {
        const code = (e as NodeJS.ErrnoException).code;
        if (code === 'ENOENT') {
            throw new ResourceNotFoundError(filePath);
        }
        throw new ResourceFetchError(`Error fetching ${filePath}`, e);
    }
};

const createHttpStream = async (url: string, options: GetResourceOptions): Promise<Resource> => {
    const isHttps = url.startsWith('https://');

    const requestOptions: RequestOptions = {
        agent: isHttps ?
            options.httpsAgent :
            options.httpAgent,
    };

    let response: IncomingMessage;
    try {
        response = await new Promise((resolve, reject) => {
            const request = (isHttps ? https : http).get(url, requestOptions);
            request.on('response', (response) => {
                resolve(response);
            });
            request.on('error', (err) => {
               reject(err);
            });
            options?.abortSignal?.addEventListener('abort', () => {
                if (response) {
                    response.destroy(new ResourceFetchAbortedError(`Fetching aborted: ${url}`));
                } else {
                    request.destroy();
                }
            }, true);
        });
    } catch (e: any) {
        if (options?.abortSignal?.aborted) {
           throw new ResourceFetchAbortedError(`Fetching aborted: ${url}`);
        }
        throw new ResourceFetchError(`Error fetching ${url}`, e);
    }

    if (!response.statusCode || response.statusCode >= 299) {
        if (response.statusCode === 404) {
            throw new ResourceNotFoundError(url);
        } else {
            throw new ResourceFetchError(`Error fetching ${url}. Status code: ${response.statusCode}`);
        }
    }

    const contentLengthHeader = response.headers['content-length'];
    const contentTypeHeader = response.headers['content-type'];
    const lastModifiedHeader = response.headers['last-modified'];

    return {
        size: contentLengthHeader ? parseInt(contentLengthHeader) : null,
        contentType: contentTypeHeader ?? null,
        lastModified: lastModifiedHeader ? new Date(lastModifiedHeader) : null,
        stream: response,
    };
};

const createDataURIString = async (uri: string): Promise<Resource> => {
    const data = uri.substring('data:'.length);
    const type = data.substring(0, data.indexOf(','));
    const [contentType, encoding] = type.split(';');
    const body = data.substring(type.length + 1);
    const buffer = Buffer.from(decodeURIComponent(body), encoding === 'base64' ? 'base64' : 'utf8');

    return {
        size: buffer.length,
        contentType,
        lastModified: null,
        stream: Readable.from(buffer),
    };
};

/*
 * Return given resources as stream. Can be a local file, http/s or a data URI.
 *
 * We deliberately don't deal with compression or caching because that should be done by reverse proxies.
 * HTTP redirects are ignored.
 */
export const getResourceAsStream = async (uri: string, options: GetResourceOptions): Promise<Resource> => {
    if (uri.startsWith('file://')) {
        return createFileStream(fileURLToPath(uri), options);
    } else if (uri.startsWith('http://') || uri.startsWith('https://')) {
       return createHttpStream(uri, options);
    } else if (uri.startsWith('data:')) {
        return createDataURIString(uri);
    } else if (uri.indexOf('://') === -1) {
        // File resource without protocol
        return createFileStream(uri, options);
    }

    throw new ResourceTypeNotSupportedError(uri);
};

/*
 * Return given resource as string.
 */
export const getResourceAsString = async (uri: string, options: GetResourceOptions): Promise<string> => {
    const {stream, contentType} = await getResourceAsStream(uri, options);
    let encoding: BufferEncoding = 'utf-8';
    if (contentType && contentType.indexOf('charset=') !== -1) {
        const charset = contentType.split('charset=')[1].trim();
        if (Buffer.isEncoding(charset)) {
            encoding = charset as BufferEncoding;
        }
    }
    return new Promise((resolve, reject) => {
        const chunks: Array<Buffer> = [];
        stream.on('data', (chunk) => chunks.push(chunk as Buffer));
        stream.on('error', (error) => reject(error));
        stream.on('end', () => resolve(Buffer.concat(chunks).toString(encoding)));
    });
};
