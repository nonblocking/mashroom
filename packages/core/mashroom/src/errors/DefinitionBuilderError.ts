
export default class DefinitionBuilderError extends Error {

    errors: Array<string>;

    constructor(message: string, errors: Array<string>) {
        super(message);
        this.name = 'DefinitionBuilderError';
        this.errors = errors;
    }

    getErrors() {
        return this.errors;
    }
}
