
export default class BootstrapError extends Error {

    constructor(message) {
        super(message);
        this.name = 'BootstrapError';
    }

}
