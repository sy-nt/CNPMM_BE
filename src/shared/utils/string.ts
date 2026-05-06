export const upperCaseToCamelCase = (input: string): string => {
    return input
        .toLowerCase() // Convert the entire string to lowercase
        .replace(/[_\s](\w)/g, (_, letter) => letter.toUpperCase());
};

export const camelCaseToWords = (input: string): string => {
    return input.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
};
