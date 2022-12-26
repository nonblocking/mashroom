
export const withinTsNode = () => {
    // @ts-ignore
    return !!process[Symbol.for('ts-node.register.instance')];
};
