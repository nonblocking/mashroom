
import type {
    MashroomLogger,
    MashroomLoggerFactory
} from '@mashroom/mashroom/type-definitions';

import type {MashroomCDNService as MashroomCDNServiceType} from '../type-definitions';

export default class MashroomCDNService implements MashroomCDNServiceType {

    private roundRobinIndex: number;
    private logger: MashroomLogger;

    constructor(private cdnHosts: Array<string>, loggerFactory: MashroomLoggerFactory) {
        this.logger = loggerFactory('mashroom.cdn.service');
        this.roundRobinIndex = 0;
        if (cdnHosts.length > 0) {
            this.logger.info('Configured CDN hosts:', this.cdnHosts);
        }
    }

    getCDNHost(): string | undefined {
        if (!this.cdnHosts.length) {
            return;
        }
        if (this.roundRobinIndex >= this.cdnHosts.length) {
            this.roundRobinIndex = 0;
        }
        return this.cdnHosts[this.roundRobinIndex ++];
    }

}
