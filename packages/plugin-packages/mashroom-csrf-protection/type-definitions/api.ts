
import type {Request} from 'express';

export interface MashroomCSRFService {

    /**
     * Get the current CSRF token for this session
     */
    getCSRFToken(request: Request): string;

    /**
     * Check if the given token is valid
     */
    isValidCSRFToken(request: Request, token: string): boolean;
}

