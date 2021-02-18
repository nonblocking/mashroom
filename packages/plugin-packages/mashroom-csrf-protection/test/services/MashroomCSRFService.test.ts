
import MashroomCSRFService from '../../src/services/MashroomCSRFService';

describe('MashroomCSRFService', () => {

    it('creates a new token if none exists', () => {
        const req: any = {
            session: {}
        };

        const mashroomCSRFService = new MashroomCSRFService(8, 18);

        const token = mashroomCSRFService.getCSRFToken(req);

        expect(token).toBeTruthy();
    });

    it('checks a given token correctly', () => {
        const req: any = {
            session: {}
        };

        const mashroomCSRFService = new MashroomCSRFService(8, 18);

        const token = mashroomCSRFService.getCSRFToken(req);

        expect(mashroomCSRFService.isValidCSRFToken(req, token)).toBeTruthy();
        expect(mashroomCSRFService.isValidCSRFToken(req, 'foo')).toBeFalsy();
    });

});

