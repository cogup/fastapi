declare const superFilter: (fields: string[], searchTerm: string, op?: symbol) => {
    [x: symbol]: any[];
};
export { superFilter };
