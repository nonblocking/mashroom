// @flow

import type {HttpHeaders} from './api';

export interface HttpHeaderFilter {
    filter(headers: HttpHeaders): void;
}
