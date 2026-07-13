
let count = 0;
const countUpdateListeners: Array<() => void> = [];

export default {
    get count() {
        return count;
    },
    set count(c) {
        if (c !== count) {
            count = c;
            countUpdateListeners.forEach((cb) => cb());
        }
    },
    onCountUpdate(cb: () => void) {
        countUpdateListeners.push(cb);
    }
};
