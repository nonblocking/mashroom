
export default class InvalidCronExpressionError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'InvalidCronExpressionError';
    }
}
