// @flow

export interface MashroomCDNService {
    /**
     * Return a CDN host or undefined if there is none configured.
     */
    getCDNHost(): ?string;
}
