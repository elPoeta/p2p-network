const hexaDigit = () => Math.random().toString(16).split('.')[1].slice(0, 4);
export const uuid = () => new Array(8).fill(0).map(() => hexaDigit()).join('-');